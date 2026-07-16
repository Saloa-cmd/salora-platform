import { type NextRequest } from "next/server";
import { createControlTowerRepository } from "@salora/backend/domains/control-tower/repository";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import {
  handleError,
  pagination,
  parseBody,
  productMutationSchema,
  requireControlPermission,
  requestId,
  slugify,
  writeActivity,
  writeAudit
} from "@/lib/server/simpleLaunchControl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "catalog:read");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const { take, skip } = pagination(request, { limit: 100, maxLimit: 100 });
    const products = await repo.products.findMany({
      take,
      skip,
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
      where: { brandKey: "SALORA" },
      include: { category: true, images: { where: { deletedAt: null }, orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] }, variants: true, addons: true, modifiers: true }
    });
    return responseJson(products, id);
  } catch (error) {
    return handleError(error, id);
  }
}

async function mutate(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "catalog:write");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const parsed = await parseBody(request, productMutationSchema);
    if (!parsed.success) return responseError("Invalid product mutation payload.", id);
    const input = parsed.data;

    if (input.action === "create") {
      const categorySlug = input.categorySlug ?? slugify(input.categoryName);
      const category = await repo.categories.upsert(
        { slug: categorySlug },
        { brandKey: "SALORA", slug: categorySlug, name: input.categoryName, nameEn: input.categoryName, sortOrder: 0 }
      );
      const product = await repo.products.upsert(
        { slug: input.slug },
        {
          slug: input.slug,
          name: input.name,
          nameAr: input.nameAr,
          nameEn: input.nameEn ?? input.name,
          description: input.description,
          descriptionAr: input.descriptionAr,
          descriptionEn: input.descriptionEn ?? input.description,
          brandKey: "SALORA",
          status: input.status,
          basePrice: input.basePrice,
          tags: input.tags,
          categoryId: category.id
        }
      );
      await writeActivity({ actorId: actor.sub, action: "product.upsert", entityType: "CatalogProduct", entityId: product.id, requestId: id, metadata: { slug: product.slug } }, repo);
      await writeAudit({ actorId: actor.sub, action: "CREATE", entityType: "CatalogProduct", entityId: product.id, after: product, requestId: id, reason: "Control Tower product upsert" }, repo);
      return responseJson(product, id, 201);
    }

    const before = await repo.products.findUnique({ slug: input.slug });
    if (!before) return responseError("Product not found.", id, 404);
    if ((input.action === "restore" || (input.action === "status" && input.status === "ACTIVE")) && Number(before.basePrice) <= 0) {
      return responseError("Approve a positive price before activating this product.", id, 409);
    }

    const data =
      input.action === "archive" ? { status: "ARCHIVED" } :
      input.action === "restore" ? { status: "ACTIVE" } :
      input.action === "status" ? { status: input.status } :
      input.action === "price" ? { basePrice: input.basePrice } :
      {
        name: input.name,
        nameAr: input.nameAr,
        nameEn: input.nameEn,
        description: input.description,
        descriptionAr: input.descriptionAr,
        descriptionEn: input.descriptionEn,
        basePrice: input.basePrice,
        status: input.status,
        tags: input.tags
      };

    const after = await repo.products.update({ slug: input.slug }, data);
    const auditAction = input.action === "archive" ? "ARCHIVE" : input.action === "restore" ? "RESTORE" : "UPDATE";
    await writeActivity({ actorId: actor.sub, action: `product.${input.action}`, entityType: "CatalogProduct", entityId: after.id, requestId: id, metadata: { slug: after.slug } }, repo);
    await writeAudit({ actorId: actor.sub, action: auditAction, entityType: "CatalogProduct", entityId: after.id, before, after, requestId: id, reason: `Control Tower product ${input.action}` }, repo);
    return responseJson(after, id);
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
