import { type NextRequest } from "next/server";
import { createControlTowerRepository } from "@salora/backend/domains/control-tower/repository";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { categoryMutationSchema, handleError, parseBody, requireControlPermission, requestId, slugify, writeActivity, writeAudit } from "@/lib/server/simpleLaunchControl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "catalog:read");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const categories = await repo.categories.findMany({
      where: { brandKey: "SALORA" },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true } } }
    });
    return responseJson(categories, id);
  } catch (error) {
    return handleError(error, id);
  }
}

async function mutate(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "catalog:write");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const parsed = await parseBody(request, categoryMutationSchema);
    if (!parsed.success) return responseError("Invalid category mutation payload.", id);
    const input = parsed.data;
    const slug = input.action === "create" ? input.slug ?? slugify(input.name) : input.slug;
    const before = await repo.categories.findUnique({ slug });
    const category = input.action === "create"
      ? await repo.categories.upsert({ slug }, { slug, name: input.name, sortOrder: input.sortOrder })
      : await repo.categories.update({ slug }, { name: input.name, sortOrder: input.sortOrder });
    await writeActivity({ actorId: actor.sub, action: `category.${input.action}`, entityType: "ProductCategory", entityId: category.id, requestId: id, metadata: { slug } }, repo);
    await writeAudit({ actorId: actor.sub, action: before ? "UPDATE" : "CREATE", entityType: "ProductCategory", entityId: category.id, before, after: category, requestId: id }, repo);
    return responseJson(category, id, input.action === "create" ? 201 : 200);
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
