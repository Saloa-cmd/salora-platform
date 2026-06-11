import { type NextRequest } from "next/server";
import { createControlTowerRepository } from "@salora/backend/domains/control-tower/repository";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { handleError, pagination, parseBody, promotionMutationSchema, requireControlPermission, requestId, writeActivity, writeAudit } from "@/lib/server/simpleLaunchControl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "catalog:read");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const { take, skip } = pagination(request, { limit: 100, maxLimit: 100 });
    const promotions = await repo.promotions.findMany({ take, skip, orderBy: [{ priority: "desc" }, { createdAt: "desc" }], include: { promotionProducts: { include: { product: true } } } });
    return responseJson(promotions, id);
  } catch (error) {
    return handleError(error, id);
  }
}

async function mutate(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "catalog:write");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const parsed = await parseBody(request, promotionMutationSchema);
    if (!parsed.success) return responseError("Invalid promotion mutation payload.", id);
    const input = parsed.data;
    const before = await repo.promotions.findUnique({ slug: input.slug });
    const promotion = input.action === "create"
      ? await repo.promotions.upsert(
          { slug: input.slug },
          { slug: input.slug, name: input.name, description: input.description, status: input.status, priority: input.priority, rules: input.rules }
        )
      : await repo.promotions.update({ slug: input.slug }, { status: input.action === "expire" ? "EXPIRED" : input.status, endsAt: input.action === "expire" ? new Date() : undefined });
    await writeActivity({ actorId: actor.sub, action: `promotion.${input.action}`, entityType: "Promotion", entityId: promotion.id, requestId: id, metadata: { slug: promotion.slug } }, repo);
    await writeAudit({ actorId: actor.sub, action: input.action === "expire" ? "ARCHIVE" : before ? "UPDATE" : "CREATE", entityType: "Promotion", entityId: promotion.id, before, after: promotion, requestId: id }, repo);
    return responseJson(promotion, id, input.action === "create" ? 201 : 200);
  } catch (error) {
    return handleError(error, id);
  }
}

export async function POST(request: NextRequest) {
  return mutate(request);
}

export async function PATCH(request: NextRequest) {
  return mutate(request);
}
