import type { NextRequest } from "next/server";
import {
  MenuCollectionDomainService,
  createMenuCollectionRepository,
  withPrismaAuthContext,
  type PrismaAuthContext
} from "@salora/backend";
import { currentAuthPayload } from "@/lib/server/auth/http";
import { requirePermission, responseError, responseJson } from "@/lib/server/domainHttp";
import { invalidateMenuAuthorityCache } from "@/lib/server/menuAuthority";
import { enforceRateLimit, rateLimitResponse } from "@/lib/server/rateLimit";

async function requestContext(request: NextRequest): Promise<PrismaAuthContext> {
  const payload = await currentAuthPayload(request);
  return {
    userId: payload.sub,
    roles: payload.roles,
    dbRole: "authenticated"
  };
}

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  try {
    await enforceRateLimit(request, "controlTower");
    if (!(await requirePermission(request, "catalog:read"))) {
      return responseError("Forbidden.", requestId, 403);
    }
    const context = await requestContext(request);
    const data = await withPrismaAuthContext(context, (database) =>
      database.menuCollection.findMany({
        where: { brandKey: "SALORA", archivedAt: null },
        orderBy: [{ kind: "asc" }, { nameEn: "asc" }],
        include: {
          sections: {
            where: { archivedAt: null },
            orderBy: { sortOrder: "asc" }
          },
          products: {
            where: { archivedAt: null },
            include: {
              product: {
                select: {
                  id: true,
                  slug: true,
                  nameAr: true,
                  nameEn: true,
                  status: true,
                  basePrice: true
                }
              }
            },
            orderBy: { sortOrder: "asc" }
          },
          revisions: {
            orderBy: { version: "desc" },
            take: 10,
            select: {
              id: true,
              version: true,
              status: true,
              checksum: true,
              changeSummary: true,
              createdAt: true
            }
          },
          publications: {
            orderBy: { createdAt: "desc" },
            take: 10
          }
        }
      })
    );

    return responseJson(data, requestId);
  } catch (error) {
    const limited = rateLimitResponse(error, requestId);
    if (limited) return limited;
    return responseError("Menu authority workspace could not be loaded.", requestId, 500);
  }
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  try {
    await enforceRateLimit(request, "controlTower");
    if (!(await requirePermission(request, "catalog:write"))) {
      return responseError("Forbidden.", requestId, 403);
    }

    const body = await request.json().catch(() => null) as { action?: string; payload?: unknown } | null;
    if (!body?.action) return responseError("Action is required.", requestId, 400);

    const context = await requestContext(request);
    const service = new MenuCollectionDomainService(createMenuCollectionRepository(context), context);
    const actorId = context.userId;
    let result: unknown;

    switch (body.action) {
      case "refresh-completeness":
        result = await service.refreshCompleteness(String((body.payload as any)?.collectionId ?? ""), actorId);
        break;
      case "create-revision":
        result = await service.createRevision(body.payload, actorId);
        break;
      case "transition":
        result = await service.transitionCollection(body.payload, actorId);
        break;
      case "publish":
        result = await service.schedulePublication(body.payload, actorId);
        invalidateMenuAuthorityCache();
        break;
      case "rollback":
        result = await service.rollbackPublication(body.payload, actorId);
        invalidateMenuAuthorityCache();
        break;
      case "create-section":
        result = await service.createSection(body.payload, actorId);
        break;
      case "assign-product":
        result = await service.assignProduct(body.payload, actorId);
        break;
      case "save-nutrition":
        result = await service.saveNutritionProfile(body.payload, actorId);
        break;
      case "save-allergen":
        result = await service.saveAllergenProfile(body.payload, actorId);
        break;
      default:
        return responseError("Unsupported menu authority action.", requestId, 400);
    }

    return responseJson(result, requestId);
  } catch (error) {
    const limited = rateLimitResponse(error, requestId);
    if (limited) return limited;
    const message = error instanceof Error ? error.message : "Menu authority operation failed.";
    return responseError(message, requestId, 400);
  }
}
