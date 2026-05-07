import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { resumes } from "@/db/schema/resumes";
import { aiRuns } from "@/db/schema/ai";
import { atsScores, jobDescriptions } from "@/db/schema/jobs";
import { requireUser } from "@/lib/auth/session";
import { runOptimization } from "@/lib/ai/graph";
import { limiters } from "@/lib/redis";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 300;

const Body = z.object({
  jobDescription: z.string().min(20),
  targetRole: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const log = logger.child({ userId: user.id, resumeId: id });

  const limiter = limiters.ai();
  if (limiter) {
    const { success } = await limiter.limit(`u:${user.id}:opt`);
    if (!success) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = Body.parse(await req.json());

  const [resume] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, user.id)))
    .limit(1);
  if (!resume) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const startedAt = Date.now();
  const [run] = await db
    .insert(aiRuns)
    .values({
      userId: user.id,
      resumeId: id,
      kind: "rewrite",
      status: "running",
      model: env.AI_MODEL_PRIMARY,
    })
    .returning();

  const [job] = await db
    .insert(jobDescriptions)
    .values({
      userId: user.id,
      title: body.targetRole ?? "Untitled Role",
      description: body.jobDescription,
    })
    .returning();

  await db.update(resumes).set({ status: "optimizing" }).where(eq(resumes.id, id));

  try {
    const out = await runOptimization({
      resume: resume.content,
      jobDescription: body.jobDescription,
    });

    const finalContent = out.rewrittenResume ?? resume.content;
    await db
      .update(resumes)
      .set({
        content: finalContent,
        targetRole: body.targetRole ?? resume.targetRole,
        status: "optimized",
        score: out.score?.overall ?? resume.score,
        updatedAt: new Date(),
      })
      .where(eq(resumes.id, id));

    if (out.score && job) {
      await db.insert(atsScores).values({
        resumeId: id,
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
          graphState: {
            jdExtraction: out.jdExtraction,
            scoreOverall: out.score?.overall,
          },
        })
        .where(eq(aiRuns.id, run.id));
    }

    log.info("optimization complete", { latencyMs: Date.now() - startedAt });

    return NextResponse.json({
      score: out.score,
      jdExtraction: out.jdExtraction,
      resumeId: id,
    });
  } catch (err) {
    log.error("optimization failed", { err: String(err) });
    if (run) {
      await db
        .update(aiRuns)
        .set({ status: "failed", error: String(err), completedAt: new Date() })
        .where(eq(aiRuns.id, run.id));
    }
    await db.update(resumes).set({ status: "draft" }).where(eq(resumes.id, id));
    return NextResponse.json({ error: "optimization_failed" }, { status: 500 });
  }
}
