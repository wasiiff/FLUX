import "server-only";
import { generateText } from "ai";
import { models } from "./provider";
import { SYSTEM } from "./prompts";
import { ResumeContentSchema, emptyResume, type ResumeContent } from "@/lib/resume/types";

export interface IngestResult {
  resume: ResumeContent;
  tokensIn: number;
  tokensOut: number;
}

/**
 * Convert raw resume text (typically extracted from a PDF) into the
 * canonical ResumeContent schema via Anthropic. Falls back to a minimal
 * empty resume if the model output fails validation.
 */
export async function ingestResumeFromText(
  rawText: string,
  fallbackName?: string,
): Promise<IngestResult> {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { resume: emptyResume(fallbackName ?? "Untitled"), tokensIn: 0, tokensOut: 0 };
  }

  const { text, usage } = await generateText({
    model: models.primary,
    system: SYSTEM.resumeIngester,
    prompt: [
      "Convert the following resume text into the ResumeContent JSON shape.",
      "Schema: { fullName, headline, summary, contact:{email,phone,location,website,linkedin}, experience:[{id,company,role,location,startDate,endDate,bullets[]}], education:[{id,school,degree,field,startDate,endDate,details}], projects:[{id,name,url,description,bullets[]}], skills:[{id,label,items[]}], certifications:[], awards:[] }",
      "<resume-text>",
      trimmed.slice(0, 24000),
      "</resume-text>",
    ].join("\n\n"),
    temperature: 0.1,
  });

  const parsed = ResumeContentSchema.safeParse(extractJson(text));
  return {
    resume: parsed.success ? parsed.data : emptyResume(fallbackName ?? "Untitled"),
    tokensIn: usage?.inputTokens ?? 0,
    tokensOut: usage?.outputTokens ?? 0,
  };
}

function extractJson(s: string): unknown {
  const trimmed = s.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced?.[1] ?? trimmed;
  try {
    return JSON.parse(body);
  } catch {
    const start = body.indexOf("{");
    const end = body.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(body.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
    return {};
  }
}
