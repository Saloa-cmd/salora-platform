import { z } from "zod";
import type { NextRequest } from "next/server";
import { SYSTEM_AUTH_CONTEXT, withPrismaAuthContext } from "@salora/backend";
import { getMenuAuthoritySnapshot } from "@/lib/server/menuAuthority";
import { enforceRateLimit, rateLimitResponse } from "@/lib/server/rateLimit";
import { responseError, responseJson } from "@/lib/server/domainHttp";

const eventSchema = z.object({
  eventType: z.enum(["view", "click", "search", "favorite", "ai_recommendation"]),
  revisionId: z.string().uuid(),
  productSlug: z.string().min(1).max(140).optional(),
  query: z.string().max(200).optional(),
  channel: z.enum(["web", "mobile", "qr", "ai"]).default("web"),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  try {
    await enforceRateLimit(request, "analytics");
    const parsed = eventSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return responseError("Invalid menu analytics event.", requestId, 400);

    const authority = await getMenuAuthoritySnapshot();
    if (!authority.revision || authority.revision.id !== parsed.data.revisionId) {
      return responseError("The analytics event does not reference the current published revision.", requestId, 409);
    }

    await withPrismaAuthContext(SYSTEM_AUTH_CONTEXT, (database) =>
      database.activityLog.create({
        data: {
          actorType: "customer",
          action: `menu.${parsed.data.eventType}`,
          entityType: "MenuCollectionRevision",
          entityId: parsed.data.revisionId,
          requestId,
          ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
          userAgent: request.headers.get("user-agent") ?? undefined,
          metadata: {
            collectionId: authority.collection.id,
            revisionId: parsed.data.revisionId,
            revisionVersion: authority.revision?.version,
            productSlug: parsed.data.productSlug,
            query: parsed.data.query,
            channel: parsed.data.channel,
            ...parsed.data.metadata
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
