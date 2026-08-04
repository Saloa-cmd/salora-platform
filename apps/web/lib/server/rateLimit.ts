import { assertDistributedRateLimit, RateLimitExceededError, type RateLimitWindow } from "@salora/backend";
import { type NextRequest } from "next/server";
import { responseError } from "./domainHttp";

export const rateLimitPolicies = {
  auth: { limit: 10, windowSeconds: 60 },
  ai: { limit: 30, windowSeconds: 60 },
  orders: { limit: 40, windowSeconds: 60 },
  whatsapp: { limit: 60, windowSeconds: 60 },
  stripe: { limit: 60, windowSeconds: 60 },
  controlTower: { limit: 120, windowSeconds: 60 },
  analytics: { limit: 180, windowSeconds: 60 }
} satisfies Record<string, RateLimitWindow>;

function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

export async function enforceRateLimit(request: NextRequest, policyName: keyof typeof rateLimitPolicies, subject?: string) {
  const policy = rateLimitPolicies[policyName];
  const identity = subject ?? clientIp(request);
  return assertDistributedRateLimit(`${policyName}:${identity}`, policy);
}

export function rateLimitResponse(error: unknown, requestId: string) {
  if (!(error instanceof RateLimitExceededError)) return null;
  const response = responseError("Too many requests.", requestId, 429);
  response.headers.set("retry-after", String(error.result.retryAfterSeconds));
  response.headers.set("x-ratelimit-limit", String(error.result.limit));
  response.headers.set("x-ratelimit-remaining", String(error.result.remaining));
  response.headers.set("x-ratelimit-reset", error.result.resetAt.toISOString());
  return response;
}
