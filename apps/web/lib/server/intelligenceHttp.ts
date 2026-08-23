import { type NextRequest } from "next/server";
import { incrementMetric, recordDuration } from "@salora/backend";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { currentAuthPayload } from "@/lib/server/auth/http";
import { hasRole } from "@/lib/server/auth/rbac";
import type { RoleName } from "@/lib/server/auth/types";

const intelligenceCache = new Map<string, { expiresAt: number; data: unknown }>();
const intelligenceCacheTtlMs = 15_000;

export type IntelligenceActor = {
  userId: string;
  roles: RoleName[];
};

function cacheKey(request: NextRequest, actor: IntelligenceActor) {
  const roleKey = [...actor.roles].sort().join(",");
  return `${actor.userId}:${roleKey}:${request.nextUrl.pathname}?${request.nextUrl.searchParams.toString()}`;
}

export async function handleIntelligenceRoute(
  request: NextRequest,
  read: (actor: IntelligenceActor) => unknown | Promise<unknown>
) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const startedAt = performance.now();
  let actor: IntelligenceActor;

  try {
    const payload = await currentAuthPayload(request);
    const roles = payload.roles as RoleName[];
    if (!hasRole(roles, ["MANAGER", "ADMIN"])) {
      incrementMetric("salora_dashboard_api_forbidden_total");
      return responseError("Forbidden.", requestId, 403);
    }
    actor = { userId: payload.sub, roles };
  } catch {
    incrementMetric("salora_dashboard_api_unauthorized_total");
    return responseError("Unauthorized.", requestId, 401);
  }

  const key = cacheKey(request, actor);
  const cached = intelligenceCache.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    incrementMetric("salora_dashboard_cache_hits_total");
    recordDuration("salora_dashboard_api_latency_ms", performance.now() - startedAt);
    return responseJson(cached.data, requestId);
  }

  incrementMetric("salora_dashboard_cache_misses_total");
  const computeStartedAt = performance.now();
  const data = await read(actor);
  recordDuration("salora_dashboard_aggregation_latency_ms", performance.now() - computeStartedAt);
  intelligenceCache.set(key, { data, expiresAt: Date.now() + intelligenceCacheTtlMs });
  recordDuration("salora_dashboard_api_latency_ms", performance.now() - startedAt);

  return responseJson(data, requestId);
}
