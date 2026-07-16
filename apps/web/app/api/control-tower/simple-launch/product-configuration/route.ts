import { type NextRequest } from "next/server";
import { withPrismaAuthContext } from "@salora/backend/database/rls-context";
import { createControlTowerRepository } from "@salora/backend/domains/control-tower/repository";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { handleError, parseBody, productConfigurationSchema, requireControlPermission, requestId, writeActivity, writeAudit } from "@/lib/server/simpleLaunchControl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "catalog:read");
    const productSlug = request.nextUrl.searchParams.get("productSlug");
    if (!productSlug) return responseError("productSlug is required.", id);
    const product = await withPrismaAuthContext({ userId: actor.sub, roles: actor.roles }, (db) => db.catalogProduct.findFirst({
      where: { slug: productSlug, brandKey: "SALORA" },
      include: { variants: { orderBy: { name: "asc" } }, addons: { orderBy: { name: "asc" } }, modifiers: { orderBy: { name: "asc" } } }
    }));
    if (!product) return responseError("Product not found.", id, 404);
    return responseJson(product, id);
  } catch (error) {
    return handleError(error, id);
  }
}

export async function PUT(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "catalog:write");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const parsed = await parseBody(request, productConfigurationSchema);
    if (!parsed.success) return responseError("Invalid product configuration.", id);
    const input = parsed.data;
    const result = await withPrismaAuthContext({ userId: actor.sub, roles: actor.roles }, async (db) => {
      const product = await db.catalogProduct.findFirst({ where: { slug: input.productSlug, brandKey: "SALORA" } });
      if (!product) return null;
      await db.productVariant.deleteMany({ where: { productId: product.id } });
      await db.productAddon.deleteMany({ where: { productId: product.id } });
      await db.productModifier.deleteMany({ where: { productId: product.id } });
      if (input.variants.length) await db.productVariant.createMany({ data: input.variants.map((variant) => ({ productId: product.id, name: variant.name, priceDelta: variant.priceDelta, sku: variant.sku })) });
      if (input.addons.length) await db.productAddon.createMany({ data: input.addons.map((addon) => ({ productId: product.id, name: addon.name, price: addon.price })) });
      if (input.modifierGroups.length) await db.productModifier.createMany({ data: input.modifierGroups.map((group) => ({ productId: product.id, name: group.name, required: group.required, options: group.options })) });
      return db.catalogProduct.findUnique({ where: { id: product.id }, include: { variants: true, addons: true, modifiers: true } });
    });
    if (!result) return responseError("Product not found.", id, 404);
    await writeActivity({ actorId: actor.sub, action: "product.configuration.replace", entityType: "CatalogProduct", entityId: result.id, requestId: id, metadata: { slug: result.slug } }, repo);
    await writeAudit({ actorId: actor.sub, action: "UPDATE", entityType: "CatalogProduct", entityId: result.id, after: result, requestId: id, reason: "Control Tower replaced variants, add-ons, and modifier groups" }, repo);
    return responseJson(result, id);
  } catch (error) {
    return handleError(error, id);
  }
}

export async function POST(request: NextRequest) {
  return PUT(request);
}
