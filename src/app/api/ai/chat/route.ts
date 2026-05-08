import { streamText } from "ai";
import { NextResponse } from "next/server";
import { models } from "@/lib/ai/provider";
import { SYSTEM } from "@/lib/ai/prompts";
import { requireUser } from "@/lib/auth/session";
import { limiters } from "@/lib/redis";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Streaming chat endpoint — used by inline AI suggestions in the editor.
 * Routes through Vercel AI Gateway via the AI SDK string-model interface.
 */
export async function POST(req: Request) {
  const user = await requireUser();
  const limiter = limiters.ai();
  if (limiter) {
    const { success } = await limiter.limit(`u:${user.id}:chat`);
    if (!success) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const { messages } = await req.json();
  const result = streamText({
    model: models.fast,
    system: SYSTEM.resumeArchitect,
    messages,
    temperature: 0.4,
  });
  return result.toUIMessageStreamResponse();
}
