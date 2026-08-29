import { type NextRequest } from "next/server";
import { createControlTowerRepository } from "@salora/backend/domains/control-tower/repository";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { verifyProductMedia } from "@/lib/server/mediaIntegrity";
import { handleError, parseBody, productImageMutationSchema, requireControlPermission, requestId, writeActivity, writeAudit } from "@/lib/server/simpleLaunchControl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "catalog:read");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const productSlug = request.nextUrl.searchParams.get("productSlug");
    const where = productSlug ? { product: { slug: productSlug }, deletedAt: null } : { deletedAt: null };
    const images = await repo.productImages.findMany({ where, include: { product: true }, orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] });
    return responseJson(images, id);
  } catch (error) {
    return handleError(error, id);
  }
}

async function mutate(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "catalog:write");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const parsed = await parseBody(request, productImageMutationSchema);
    if (!parsed.success) return responseError("Invalid product image mutation payload.", id);
    const input = parsed.data;

    if (input.action === "add") {
      const product = await repo.products.findUnique({ slug: input.productSlug });
      if (!product) return responseError("Product not found.", id, 404);
      const verified = await verifyProductMedia(input);
      if (input.isPrimary) await repo.productImages.updateMany({ productId: product.id }, { isPrimary: false });
      const image = await repo.productImages.create({
        productId: product.id,
        storageBucket: input.storageBucket,
        storagePath: input.storagePath,
        publicUrl: input.publicUrl,
        altText: input.altTextEn,
        sortOrder: input.sortOrder,
        isPrimary: input.isPrimary,
        metadata: { mimeType: input.mimeType, width: input.width, height: input.height, fileSize: input.fileSize, checksum: input.checksum, altTextAr: input.altTextAr, altTextEn: input.altTextEn, ...verified }
      });
      await writeActivity({ actorId: actor.sub, action: "productImage.add", entityType: "ProductImage", entityId: image.id, requestId: id, metadata: { productSlug: input.productSlug } }, repo);
      await writeAudit({ actorId: actor.sub, action: "CREATE", entityType: "ProductImage", entityId: image.id, after: image, requestId: id }, repo);
      return responseJson(image, id, 201);
    }

    const before = await repo.productImages.findUnique({ id: input.imageId });
    if (!before) return responseError("Product image not found.", id, 404);
    if (input.action === "primary") {
      await repo.productImages.updateMany({ productId: before.productId }, { isPrimary: false });
      const image = await repo.productImages.update({ id: input.imageId }, { isPrimary: true });
      await writeActivity({ actorId: actor.sub, action: "productImage.primary", entityType: "ProductImage", entityId: image.id, requestId: id }, repo);
      await writeAudit({ actorId: actor.sub, action: "UPDATE", entityType: "ProductImage", entityId: image.id, before, after: image, requestId: id }, repo);
      return responseJson(image, id);
    }

    const image = await repo.productImages.update({ id: input.imageId }, { archivedAt: new Date(), isPrimary: false });
    await writeActivity({ actorId: actor.sub, action: "productImage.archive", entityType: "ProductImage", entityId: image.id, requestId: id }, repo);
    await writeAudit({ actorId: actor.sub, action: "ARCHIVE", entityType: "ProductImage", entityId: image.id, before, after: image, requestId: id }, repo);
    return responseJson(image, id);
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
