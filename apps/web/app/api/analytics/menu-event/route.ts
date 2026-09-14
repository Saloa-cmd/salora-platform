import type { NextRequest } from "next/server";
import { SYSTEM_AUTH_CONTEXT, withPrismaAuthContext } from "@salora/backend";
import { saloraRuntime } from "@salora/config";
import { MAX_ANALYTICS_BODY_BYTES, parseMenuAnalyticsEvent } from "@/lib/analytics/privacy";
import { getMenuAuthoritySnapshot } from "@/lib/server/menuAuthority";
import { enforceRateLimit, rateLimitResponse } from "@/lib/server/rateLimit";
import { responseError, responseJson } from "@/lib/server/domainHttp";

export async function POST(request: NextRequest) {
  const forwardedRequestId = request.headers.get("x-request-id");
  const requestId = forwardedRequestId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(forwardedRequestId)
    ? forwardedRequestId
    : crypto.randomUUID();

  if (!saloraRuntime.analyticsEnabled) {
    return new Response(null, {
      status: 204,
      headers: { "cache-control": "no-store", "x-request-id": requestId }
    });
  }

  try {
    await enforceRateLimit(request, "analytics");
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_ANALYTICS_BODY_BYTES) {
      return responseError("Invalid menu analytics event.", requestId, 422);
    }
    const parsed = parseMenuAnalyticsEvent(await request.text());
    if (!parsed.success) return responseError("Invalid menu analytics event.", requestId, 422);

    const authority = await getMenuAuthoritySnapshot();
    if (!authority.revision || authority.revision.id !== parsed.data.revisionId) {
      return responseError("The analytics event does not reference the current published revision.", requestId, 409);
    }
    if (parsed.data.productSlug && !authority.products.some((product) => product.id === parsed.data.productSlug)) {
      return responseError("The analytics event does not reference a current product.", requestId, 422);
    }

    await withPrismaAuthContext(SYSTEM_AUTH_CONTEXT, (database) =>
      database.activityLog.create({
        data: {
          actorType: "customer",
          action: `menu.${parsed.data.eventType}`,
          entityType: "MenuCollectionRevision",
          entityId: parsed.data.revisionId,
          requestId,
          metadata: {
            collectionId: authority.collection.id,
            revisionId: parsed.data.revisionId,
            revisionVersion: authority.revision?.version,
            productSlug: parsed.data.productSlug,
            query: parsed.data.query,
            channel: parsed.data.channel,
            client: parsed.data.metadata ?? {}
          }
        }
      })
    );

    return responseJson({ accepted: true }, requestId, 202);
  } catch (error) {
    const limited = rateLimitResponse(error, requestId);
    if (limited) return limited;
    return responseError("Menu analytics event could not be recorded.", requestId, 500);
  }
}
