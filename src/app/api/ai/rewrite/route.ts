import { NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "ai";
import { models } from "@/lib/ai/provider";
import { SYSTEM } from "@/lib/ai/prompts";
import { requireUser } from "@/lib/auth/session";
import { limiters } from "@/lib/redis";

export const runtime = "nodejs";

const Body = z.object({
  text: z.string().min(1),
  intent: z.enum(["impact", "concise", "executive", "quantify"]).default("impact"),
  context: z.string().optional(),
});

const INTENT_NUDGE: Record<z.infer<typeof Body>["intent"], string> = {
  impact: "Lead with measurable impact ($, %, time, scale). Replace weak verbs.",
  concise: "Tighten to 18-22 words. Remove filler.",
  executive: "Elevate register to senior-executive register. Emphasize strategy.",
  quantify: "Add concrete metrics where reasonable; do not invent numbers.",
};

export async function POST(req: Request) {
  const user = await requireUser();
  const limiter = limiters.ai();
  if (limiter) {
    const { success } = await limiter.limit(`u:${user.id}:rewrite`);
    if (!success) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const body = Body.parse(await req.json());

  const result = await generateText({
    model: models.fast,
    system: SYSTEM.resumeArchitect,
    prompt: [
      `Rewrite the following resume snippet. ${INTENT_NUDGE[body.intent]}`,
      body.context ? `Target context: ${body.context}` : "",
      `\n<snippet>\n${body.text}\n</snippet>\n`,
      "Return only the rewritten line(s), no preamble.",
    ].join("\n"),
    temperature: 0.5,
  });

  return NextResponse.json({ text: result.text });
}
