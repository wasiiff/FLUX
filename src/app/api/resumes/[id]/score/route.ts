import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { resumes } from "@/db/schema/resumes";
import { atsScores } from "@/db/schema/jobs";
import { requireUser } from "@/lib/auth/session";
import { scoreResume } from "@/lib/ats/scorer";
import { limiters } from "@/lib/redis";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const [resume] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, user.id)))
    .limit(1);
  if (!resume) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const [latest] = await db
    .select()
    .from(atsScores)
    .where(eq(atsScores.resumeId, id))
    .orderBy(desc(atsScores.createdAt))
    .limit(1);

  return NextResponse.json({ score: latest ?? null });
}

const Body = z.object({ jobDescription: z.string().optional() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const limiter = limiters.api();
  if (limiter) {
    const { success } = await limiter.limit(`u:${user.id}:score`);
    if (!success) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const { jobDescription } = Body.parse(await req.json());

  const [resume] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, user.id)))
    .limit(1);
  if (!resume) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const keywords = jobDescription
    ? Array.from(new Set(jobDescription.match(/[A-Za-z][A-Za-z0-9+#.\-]{2,}/g) ?? []))
        .filter((k) => k.length > 3)
        .slice(0, 80)
    : [];

  const result = scoreResume({ resume: resume.content, keywords });

  const [row] = await db
    .insert(atsScores)
    .values({
      resumeId: id,
      overall: result.overall,
      keywordMatch: result.keywordMatch,
      formatting: result.formatting,
      quantification: result.quantification,
      readability: result.readability,
      breakdown: {
        matched: result.matched,
        missing: result.missing,
        suggestions: result.suggestions,
      },
    })
    .returning();

  await db.update(resumes).set({ score: result.overall }).where(eq(resumes.id, id));

  return NextResponse.json({ score: row });
}
