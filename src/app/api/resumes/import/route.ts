import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { resumes } from "@/db/schema/resumes";
import { aiRuns } from "@/db/schema/ai";
import { atsScores, jobDescriptions } from "@/db/schema/jobs";
import { requireUser } from "@/lib/auth/session";
import { runOptimization } from "@/lib/ai/graph";
import { ingestResumeFromText } from "@/lib/ai/ingest";
import { parsePdf } from "@/lib/resume/parse-pdf";
import { models } from "@/lib/ai/provider";
import { limiters } from "@/lib/redis";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_PDF_BYTES = 8 * 1024 * 1024; // 8 MB

/**
 * POST /api/resumes/import
 * multipart/form-data:
 *   file:            PDF (required)
 *   jobDescription:  string (required, min 20 chars)
 *   targetRole:      string (optional)
 *   title:           string (optional, defaults to filename)
 *
 * Pipeline: parse PDF → AI ingest → AI optimize (analyze → rewrite → score)
 *           → persist new resume row → return { resumeId }.
 */
export async function POST(req: Request) {
  const user = await requireUser();
  const log = logger.child({ userId: user.id, route: "resumes/import" });

  const limiter = limiters.ai();
  if (limiter) {
    const { success } = await limiter.limit(`u:${user.id}:import`);
    if (!success) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const file = form.get("file");
  const jobDescription = String(form.get("jobDescription") ?? "").trim();
  const targetRole = String(form.get("targetRole") ?? "").trim();
  const titleRaw = String(form.get("title") ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }
  if (file.type && file.type !== "application/pdf") {
    return NextResponse.json({ error: "unsupported_type" }, { status: 415 });
  }
  if (file.size > MAX_PDF_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }
  if (jobDescription.length < 20) {
    return NextResponse.json({ error: "jd_too_short" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let parsed;
  try {
    parsed = await parsePdf(buffer);
  } catch (err) {
    log.error("pdf parse failed", { err: String(err) });
    return NextResponse.json({ error: "pdf_parse_failed" }, { status: 422 });
  }

  if (!parsed.text || parsed.text.length < 80) {
    return NextResponse.json(
      { error: "pdf_empty", message: "Could not extract text from PDF (scanned or image-only?)" },
      { status: 422 },
    );
  }

  const fallbackTitle =
    titleRaw || file.name.replace(/\.pdf$/i, "") || (targetRole ? `Resume — ${targetRole}` : "Imported Resume");

  const startedAt = Date.now();
  let totalIn = 0;
  let totalOut = 0;

  try {
    // 1. Ingest raw text → ResumeContent
    const ingest = await ingestResumeFromText(parsed.text, user.name ?? fallbackTitle);
    totalIn += ingest.tokensIn;
    totalOut += ingest.tokensOut;

    // 2. Persist a new resume immediately so we have a stable id even if optimize fails
    const [created] = await db
      .insert(resumes)
      .values({
        userId: user.id,
        title: fallbackTitle.slice(0, 200),
        targetRole: targetRole || null,
        status: "optimizing",
        content: ingest.resume,
      })
      .returning();
    if (!created) throw new Error("Failed to create resume row");

    // 3. Record run + JD
    const [run] = await db
      .insert(aiRuns)
      .values({
        userId: user.id,
        resumeId: created.id,
        kind: "rewrite",
        status: "running",
        model: models.primary,
      })
      .returning();
    const [job] = await db
      .insert(jobDescriptions)
      .values({
        userId: user.id,
        title: targetRole || "Untitled Role",
        description: jobDescription,
      })
      .returning();

    // 4. Run optimization graph (analyze → rewrite → score)
    const out = await runOptimization({
      resume: ingest.resume,
      jobDescription,
    });
    totalIn += out.tokensIn;
    totalOut += out.tokensOut;

    const finalContent = out.rewrittenResume ?? ingest.resume;
    await db
      .update(resumes)
      .set({
        content: finalContent,
        status: "optimized",
        score: out.score?.overall ?? null,
        updatedAt: new Date(),
      })
      .where(eq(resumes.id, created.id));

    if (out.score && job) {
      await db.insert(atsScores).values({
        resumeId: created.id,
        jobId: job.id,
        overall: out.score.overall,
        keywordMatch: out.score.keywordMatch,
        formatting: out.score.formatting,
        quantification: out.score.quantification,
        readability: out.score.readability,
        breakdown: {
          matched: out.score.matched,
          missing: out.score.missing,
          suggestions: out.score.suggestions,
        },
      });
    }

    if (run) {
      await db
        .update(aiRuns)
        .set({
          status: "completed",
          completedAt: new Date(),
          latencyMs: Date.now() - startedAt,
          inputTokens: totalIn,
          outputTokens: totalOut,
          graphState: {
            jdExtraction: out.jdExtraction,
            scoreOverall: out.score?.overall ?? null,
            ingestedPages: parsed.pages,
          },
        })
        .where(eq(aiRuns.id, run.id));
    }

    log.info("import complete", {
      resumeId: created.id,
      latencyMs: Date.now() - startedAt,
      tokensIn: totalIn,
      tokensOut: totalOut,
      pages: parsed.pages,
    });

    return NextResponse.json({
      resumeId: created.id,
      score: out.score,
      jdExtraction: out.jdExtraction,
    });
  } catch (err) {
    log.error("import failed", { err: String(err) });
    return NextResponse.json({ error: "import_failed" }, { status: 500 });
  }
}
