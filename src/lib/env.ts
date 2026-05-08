import { z } from "zod";

const ServerEnv = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.string().url(),

  BETTER_AUTH_SECRET: z.string().min(16),
  BETTER_AUTH_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  /**
   * Vercel AI Gateway — one key, hundreds of models.
   * On Vercel, this is auto-injected via OIDC tokens; locally, set explicitly.
   * Reference: https://vercel.com/docs/ai-gateway
   */
  AI_GATEWAY_API_KEY: z.string().optional(),

  /**
   * Default model IDs in `provider/model-id` format. Swap freely without code changes.
   * Browse: https://vercel.com/ai-gateway/models
   */
  AI_MODEL_PRIMARY: z.string().default("anthropic/claude-opus-4.7"),
  AI_MODEL_FAST: z.string().default("anthropic/claude-haiku-4.5"),

  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

const ClientEnv = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),
});

function parse() {
  const isServer = typeof window === "undefined";
  const result = isServer
    ? ServerEnv.merge(ClientEnv).safeParse(process.env)
    : ClientEnv.safeParse({
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      });

  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables. See .env.example");
  }
  return result.data;
}

export const env = parse() as z.infer<typeof ServerEnv> & z.infer<typeof ClientEnv>;
