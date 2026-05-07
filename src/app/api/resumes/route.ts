import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { resumes } from "@/db/schema/resumes";
import { requireUser } from "@/lib/auth/session";
import { emptyResume } from "@/lib/resume/types";
import { limiters } from "@/lib/redis";

export async function GET() {
  const user = await requireUser();
  const rows = await db.query.resumes.findMany({
    where: (r, { eq }) => eq(r.userId, user.id),
    orderBy: (r, { desc }) => desc(r.updatedAt),
    limit: 50,
  });
  return NextResponse.json({ resumes: rows });
}

const CreateBody = z.object({
  title: z.string().min(1).max(200),
  targetRole: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await requireUser();
  const limiter = limiters.api();
  if (limiter) {
    const { success } = await limiter.limit(`u:${user.id}:resume:create`);
    if (!success) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const body = CreateBody.parse(await req.json());
  const [row] = await db
    .insert(resumes)
    .values({
      userId: user.id,
      title: body.title,
      targetRole: body.targetRole ?? null,
      status: "draft",
      content: emptyResume(user.name ?? body.title),
    })
    .returning();
  return NextResponse.json({ resume: row }, { status: 201 });
}
