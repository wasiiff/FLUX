import { createAnthropic } from "@ai-sdk/anthropic";
import { env } from "@/lib/env";

/**
 * Vercel AI SDK provider — points at the AI Gateway when configured,
 * otherwise speaks Anthropic directly.
 */
export const anthropic = createAnthropic({
  apiKey: env.ANTHROPIC_API_KEY,
  baseURL: env.AI_GATEWAY_URL,
});

export const models = {
  primary: anthropic(env.AI_MODEL_PRIMARY),
  fast: anthropic(env.AI_MODEL_FAST),
} as const;
