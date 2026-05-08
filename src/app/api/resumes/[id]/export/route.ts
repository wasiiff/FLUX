import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { resumes, resumeExports } from "@/db/schema/resumes";
import { requireUser } from "@/lib/auth/session";
import { renderResumePdf } from "@/lib/resume/pdf";
import { uploadBuffer } from "@/lib/cloudinary";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const Body = z.object({
  template: z.string().default("corporate-modern"),
  accent: z.string().default("#000000"),
  format: z.enum(["pdf"]).default("pdf"),
  upload: z.boolean().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const body = Body.parse(await req.json());

  const [resume] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, user.id)))
    .limit(1);
  if (!resume) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const buffer = await renderResumePdf(resume.content, {
    template: body.template as never,
    accent: body.accent,
  });

  let cloudinaryUrl: string | null = null;
  if (body.upload && env.CLOUDINARY_CLOUD_NAME) {
    const up = await uploadBuffer(buffer, {
      folder: `flux/users/${user.id}/exports`,
      publicId: `${id}-${Date.now()}`,
      resourceType: "raw",
    });
    cloudinaryUrl = up.url;
  }

  await db.insert(resumeExports).values({
    resumeId: id,
    format: "pdf",
    template: body.template,
    cloudinaryUrl,
    sizeBytes: buffer.byteLength,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(resume.title)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
