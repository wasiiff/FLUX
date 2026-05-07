import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { resumes, resumeVersions, type Resume, type ResumeVersion } from "@/db/schema/resumes";
import { atsScores, type AtsScore as DbAtsScore } from "@/db/schema/jobs";

export async function listResumes(userId: string, options: { archived?: boolean } = {}) {
  const where = options.archived
    ? eq(resumes.userId, userId)
    : and(eq(resumes.userId, userId), isNull(resumes.archivedAt));

  return db
    .select()
    .from(resumes)
    .where(where)
    .orderBy(desc(resumes.updatedAt))
    .limit(50);
}

export async function getResume(userId: string, id: string): Promise<Resume | null> {
  const [row] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function listVersions(resumeId: string): Promise<ResumeVersion[]> {
  return db
    .select()
    .from(resumeVersions)
    .where(eq(resumeVersions.resumeId, resumeId))
    .orderBy(desc(resumeVersions.versionNumber))
    .limit(20);
}

export async function latestScore(resumeId: string): Promise<DbAtsScore | null> {
  const [row] = await db
    .select()
    .from(atsScores)
    .where(eq(atsScores.resumeId, resumeId))
    .orderBy(desc(atsScores.createdAt))
    .limit(1);
  return row ?? null;
}

export async function dashboardStats(userId: string) {
  const list = await listResumes(userId);
  const optimized = list.filter((r) => r.status === "optimized").length;
  const optimizing = list.filter((r) => r.status === "optimizing").length;
  const scored = list.filter((r) => r.score !== null);
  const matchRate =
    scored.length > 0
      ? Math.round(scored.reduce((sum, r) => sum + (r.score ?? 0), 0) / scored.length)
      : 0;
  const careerScore =
    list.length > 0 ? Math.min(100, Math.round((optimized / list.length) * 100)) : 0;

  return {
    total: list.length,
    optimized,
    optimizing,
    matchRate,
    careerScore,
    recent: list.slice(0, 5),
  };
}
