import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { env } from "@/lib/env";

let _redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (_redis) return _redis;
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return null;
  _redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
  return _redis;
}

export function makeLimiter(opts: { tokens: number; windowSeconds: number; prefix: string }) {
  const redis = getRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(opts.tokens, `${opts.windowSeconds} s`),
    analytics: true,
    prefix: opts.prefix,
  });
}

export const limiters = {
  ai: () => makeLimiter({ tokens: 30, windowSeconds: 60, prefix: "rl:ai" }),
  api: () => makeLimiter({ tokens: 120, windowSeconds: 60, prefix: "rl:api" }),
};

export async function cached<T>(
  key: string,
  ttlSec: number,
  loader: () => Promise<T>,
): Promise<T> {
  const r = getRedis();
  if (!r) return loader();
  const hit = await r.get<T>(key);
  if (hit) return hit;
  const value = await loader();
  await r.set(key, value, { ex: ttlSec });
  return value;
}
