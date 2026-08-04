import type { NextRequest } from "next/server";
import {
  MenuCollectionDomainService,
  MenuCollectionOperatorService,
  createMenuCollectionRepository,
  menuOperatorPublicationSchema,
  menuOperatorRollbackSchema,
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

function requiredParam(request: NextRequest, key: string): string {
  const value = request.nextUrl.searchParams.get(key)?.trim();
  if (!value) throw new Error(`${key} is required.`);
  return value;
}

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  try {
    await enforceRateLimit(request, "controlTower");
    if (!(await requirePermission(request, "catalog:read"))) {
      return responseError("Forbidden.", requestId, 403);
    }

    const context = await requestContext(request);
    const repository = createMenuCollectionRepository(context);
    const operator = new MenuCollectionOperatorService(repository, context);
    const view = request.nextUrl.searchParams.get("view") ?? "workspace";

    if (view === "diff") {
      const data = await operator.diffRevisions({
        collectionId: requiredParam(request, "collectionId"),
        leftRevisionId: requiredParam(request, "leftRevisionId"),
        rightRevisionId: requiredParam(request, "rightRevisionId")
      });
      return responseJson(data, requestId);
    }

    if (view === "preview") {
      const data = await operator.previewCollection({
        collectionId: requiredParam(request, "collectionId")
      });
      return responseJson(data, requestId);
    }

    if (view === "validation") {
      const data = await operator.validateCollection({
        collectionId: requiredParam(request, "collectionId"),
        revisionId: request.nextUrl.searchParams.get("revisionId")?.trim() || undefined
      });
      return responseJson(data, requestId);
    }

    if (view === "audit") {
      const data = await withPrismaAuthContext(context, (database) =>
        database.auditLog.findMany({
          where: {
            entityType: {
              in: [
                "MenuCollection",
                "MenuCollectionSection",
                "MenuCollectionProduct",
                "MenuCollectionRevision",
                "MenuPublication"
              ]
            }
          },
          orderBy: { createdAt: "desc" },
          take: 100
        })
      );
      return responseJson(data, requestId);
    }

    const data = await withPrismaAuthContext(context, (database) =>
      database.menuCollection.findMany({
        where: { brandKey: "SALORA", archivedAt: null },
        orderBy: [{ kind: "asc" }, { nameEn: "asc" }],
        include: {
          activeRevision: {
            select: {
              id: true,
              version: true,
              checksum: true,
              createdAt: true
            }
          },
          sections: {
            where: { archivedAt: null },
            orderBy: [{ sortOrder: "asc" }, { key: "asc" }]
          },
          products: {
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
            orderBy: [{ sectionId: "asc" }, { sortOrder: "asc" }, { productId: "asc" }]
          },
          revisions: {
            orderBy: { version: "desc" },
            take: 25,
            select: {
              id: true,
              version: true,
              status: true,
              checksum: true,
              changeSummary: true,
              createdBy: true,
              createdAt: true
            }
          },
          publications: {
            orderBy: { createdAt: "desc" },
            take: 25,
            include: {
              revision: {
                select: {
                  id: true,
                  version: true,
                  checksum: true
                }
              }
            }
          }
        }
      })
    );

    return responseJson(data, requestId);
  } catch (error) {
    const limited = rateLimitResponse(error, requestId);
    if (limited) return limited;
    const message = error instanceof Error ? error.message : "Menu authority workspace could not be loaded.";
    return responseError(message, requestId, 400);
  }
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  try {
    await enforceRateLimit(request, "controlTower");
    if (!(await requirePermission(request, "catalog:write"))) {
      return responseError("Forbidden.", requestId, 403);
    }

    const body = await request.json().catch(() => null) as {
      action?: string;
      payload?: unknown;
    } | null;
    if (!body?.action) return responseError("Action is required.", requestId, 400);

    const context = await requestContext(request);
    const repository = createMenuCollectionRepository(context);
    const service = new MenuCollectionDomainService(repository, context);
    const operator = new MenuCollectionOperatorService(repository, context);
    const actorId = context.userId;
    let result: unknown;

    switch (body.action) {
      case "refresh-completeness":
        result = await service.refreshCompleteness(
          String((body.payload as { collectionId?: string } | null)?.collectionId ?? ""),
          actorId
        );
        break;
      case "validate":
        result = await operator.validateCollection(body.payload);
        break;
      case "reorder-sections":
        result = await operator.reorderSections(body.payload, actorId);
        break;
      case "reorder-products":
        result = await operator.reorderProducts(body.payload, actorId);
        break;
      case "bulk-memberships":
        result = await operator.bulkMemberships(body.payload, actorId);
        break;
      case "create-revision":
        result = await service.createRevision(body.payload, actorId);
        break;
      case "transition":
        result = await service.transitionCollection(body.payload, actorId);
        break;
      case "publish": {
        const input = menuOperatorPublicationSchema.parse(body.payload);
        result = await service.schedulePublication(input, actorId);
        invalidateMenuAuthorityCache();
        break;
      }
      case "rollback": {
        const input = menuOperatorRollbackSchema.parse(body.payload);
        result = await service.rollbackPublication(input, actorId);
        invalidateMenuAuthorityCache();
        break;
      }
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
    const status = message.startsWith("MENU_AUTHORITY_CONFLICT") ? 409 : 400;
    return responseError(message, requestId, status);
  }
}
