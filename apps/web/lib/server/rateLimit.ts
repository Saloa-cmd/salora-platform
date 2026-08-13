import {
  assertDistributedRateLimit,
  RateLimitExceededError,
  RateLimitUnavailableError,
  type RateLimitWindow
} from "@salora/backend";
import { type NextRequest } from "next/server";
import { responseError } from "./domainHttp";

type ApplicationRateLimitPolicy = RateLimitWindow & {
  failureMode: "closed";
};

// These policies protect authentication, privileged reads, and mutations.
// Redis unavailability therefore fails closed with a sanitized 503 response.
export const rateLimitPolicies = {
  auth: { limit: 10, windowSeconds: 60, failureMode: "closed" },
  ai: { limit: 30, windowSeconds: 60, failureMode: "closed" },
  orders: { limit: 40, windowSeconds: 60, failureMode: "closed" },
  whatsapp: { limit: 60, windowSeconds: 60, failureMode: "closed" },
  stripe: { limit: 60, windowSeconds: 60, failureMode: "closed" },
  controlTower: { limit: 120, windowSeconds: 60, failureMode: "closed" },
  analytics: { limit: 180, windowSeconds: 60, failureMode: "closed" }
} satisfies Record<string, ApplicationRateLimitPolicy>;

function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

export async function enforceRateLimit(request: NextRequest, policyName: keyof typeof rateLimitPolicies, subject?: string) {
  const policy = rateLimitPolicies[policyName];
  const identity = subject ?? clientIp(request);
  return assertDistributedRateLimit(`${policyName}:${identity}`, {
    limit: policy.limit,
    windowSeconds: policy.windowSeconds
  });
}

export function rateLimitResponse(error: unknown, requestId: string) {
  if (error instanceof RateLimitExceededError) {
    const response = responseError("Too many requests.", requestId, 429);
    response.headers.set("cache-control", "no-store, max-age=0");
    response.headers.set("retry-after", String(error.result.retryAfterSeconds));
    response.headers.set("x-ratelimit-limit", String(error.result.limit));
    response.headers.set("x-ratelimit-remaining", String(error.result.remaining));
    response.headers.set("x-ratelimit-reset", error.result.resetAt.toISOString());
    return response;
  }

  if (error instanceof RateLimitUnavailableError) {
    const response = responseError("Request protection is temporarily unavailable.", requestId, 503);
    response.headers.set("cache-control", "no-store, max-age=0");
    response.headers.set("retry-after", "5");
    return response;
  }

  return null;
}
