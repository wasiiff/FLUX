import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { resumes } from "@/db/schema/resumes";
import { requireUser } from "@/lib/auth/session";
import { ResumeContentSchema } from "@/lib/resume/types";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const [row] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, user.id)))
    .limit(1);
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ resume: row });
}

const PatchBody = z.object({
  title: z.string().optional(),
  targetRole: z.string().nullable().optional(),
  content: ResumeContentSchema.optional(),
  status: z.enum(["draft", "optimizing", "optimized", "archived"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const body = PatchBody.parse(await req.json());
  const [row] = await db
    .update(resumes)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(resumes.id, id), eq(resumes.userId, user.id)))
    .returning();
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ resume: row });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const result = await db
    .delete(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, user.id)))
    .returning({ id: resumes.id });
  if (result.length === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
