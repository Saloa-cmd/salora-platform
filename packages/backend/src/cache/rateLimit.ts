import { connectRedis } from "./redis";
import { incrementMetric } from "../runtime/metrics";

export type RateLimitWindow = {
  limit: number;
  windowSeconds: number;
};

export type RateLimitResult = {
  allowed: boolean;
  key: string;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds: number;
};

export class RateLimitExceededError extends Error {
  readonly result: RateLimitResult;

  constructor(result: RateLimitResult) {
    super("Rate limit exceeded.");
    this.name = "RateLimitExceededError";
    this.result = result;
  }
}

export class RateLimitUnavailableError extends Error {
  constructor(cause: unknown) {
    super("Distributed rate limit service is unavailable.", { cause });
    this.name = "RateLimitUnavailableError";
  }
}

function normalizeScope(scope: string) {
  return scope.replace(/[^a-zA-Z0-9:_-]/g, "_").slice(0, 180);
}

export async function checkDistributedRateLimit(scope: string, window: RateLimitWindow): Promise<RateLimitResult> {
  const redis = await connectRedis();
  const key = `salora:rate-limit:${normalizeScope(scope)}`;
  const now = Date.now();
  const resetAt = new Date(now + window.windowSeconds * 1000);

  const [count, ttl] = await redis
    .multi()
    .incr(key)
    .expire(key, window.windowSeconds, "NX")
    .ttl(key)
    .exec()
    .then((results) => {
      if (!results) throw new Error("Redis rate limit transaction failed.");
      const incrError = results[0]?.[0];
      const ttlError = results[2]?.[0];
      if (incrError) throw incrError;
      if (ttlError) throw ttlError;
      return [Number(results[0]?.[1] ?? 0), Number(results[2]?.[1] ?? window.windowSeconds)] as const;
    });

  const retryAfterSeconds = ttl > 0 ? ttl : window.windowSeconds;
  const result: RateLimitResult = {
    allowed: count <= window.limit,
    key,
    limit: window.limit,
    remaining: Math.max(window.limit - count, 0),
    resetAt: new Date(now + retryAfterSeconds * 1000),
    retryAfterSeconds
  };

  incrementMetric(result.allowed ? "salora_rate_limit_allowed_total" : "salora_rate_limit_blocked_total");
  return result;
}

export async function assertDistributedRateLimit(scope: string, window: RateLimitWindow): Promise<RateLimitResult> {
  let result: RateLimitResult;
  try {
    result = await checkDistributedRateLimit(scope, window);
  } catch (error) {
    incrementMetric("salora_rate_limit_unavailable_total");
    throw new RateLimitUnavailableError(error);
  }
  if (!result.allowed) {
    throw new RateLimitExceededError(result);
  }
  return result;
}
