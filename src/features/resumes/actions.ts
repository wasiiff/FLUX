"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, max } from "drizzle-orm";
import { db } from "@/db/client";
import { resumes, resumeVersions } from "@/db/schema/resumes";
import { requireUser } from "@/lib/auth/session";
import { emptyResume, ResumeContentSchema, type ResumeContent } from "@/lib/resume/types";

export async function createResume(formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "Untitled Resume");
  const targetRole = (formData.get("targetRole") as string) ?? null;

  const [row] = await db
    .insert(resumes)
    .values({
      userId: user.id,
      title,
      targetRole,
      status: "draft",
      content: emptyResume(user.name ?? title),
    })
    .returning();

  revalidatePath("/dashboard");
  if (!row) throw new Error("Failed to create resume");
  redirect(`/editor/${row.id}`);
}

export async function updateResumeContent(id: string, content: ResumeContent) {
  const user = await requireUser();
  const validated = ResumeContentSchema.parse(content);

  const [row] = await db
    .update(resumes)
    .set({ content: validated, updatedAt: new Date() })
    .where(and(eq(resumes.id, id), eq(resumes.userId, user.id)))
    .returning();

  if (!row) throw new Error("Resume not found");
  revalidatePath(`/editor/${id}`);
  return row;
}

export async function snapshotVersion(id: string, label?: string) {
  const user = await requireUser();
  const [resume] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, user.id)))
    .limit(1);
  if (!resume) throw new Error("Resume not found");

  const [{ next }] = await db
    .select({ next: max(resumeVersions.versionNumber) })
    .from(resumeVersions)
    .where(eq(resumeVersions.resumeId, id));
  const versionNumber = (next ?? 0) + 1;

  const [version] = await db
    .insert(resumeVersions)
    .values({
      resumeId: id,
      versionNumber,
      label: label ?? `v${versionNumber}`,
      content: resume.content,
      createdBy: user.id,
    })
    .returning();

  revalidatePath(`/editor/${id}`);
  return version;
}

export async function archiveResume(id: string) {
  const user = await requireUser();
  await db
    .update(resumes)
    .set({ archivedAt: new Date(), status: "archived" })
    .where(and(eq(resumes.id, id), eq(resumes.userId, user.id)));
  revalidatePath("/dashboard");
}
