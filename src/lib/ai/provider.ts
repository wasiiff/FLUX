import { env } from "@/lib/env";

/**
 * Vercel AI Gateway integration for AI SDK v5/v6.
 *
 * The AI SDK accepts model IDs as plain strings of the form `provider/model-id`
 * (e.g. "anthropic/claude-opus-4.7"). When `AI_GATEWAY_API_KEY` is present,
 * the SDK automatically routes calls through https://ai-gateway.vercel.sh.
 *
 * On Vercel deployments, an OIDC token is auto-injected so the env var is
 * optional; locally, set `AI_GATEWAY_API_KEY` in `.env.local`.
 *
 * Docs: https://vercel.com/docs/ai-gateway
 */

export const models = {
  /** High-fidelity reasoning model — used for the optimization graph. */
  primary: env.AI_MODEL_PRIMARY,
  /** Lower-latency / cheaper model — used for streaming chat & micro-rewrites. */
  fast: env.AI_MODEL_FAST,
} as const;

export type ModelId = (typeof models)[keyof typeof models];

/**
 * Resolve a model ID by alias. Useful when calling sites need a string
 * but want to opt into the configured "primary" or "fast" model.
 */
export function resolveModel(id: keyof typeof models | (string & {})): string {
  if (id in models) return models[id as keyof typeof models];
  return id;
}
