import { type NextRequest } from "next/server";
import { createControlTowerRepository } from "@salora/backend/domains/control-tower/repository";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { handleError, pagination, parseBody, requireControlPermission, requestId, writeActivity, writeAudit } from "@/lib/server/simpleLaunchControl";
import { mediaMutationSchema, runProductAiDraft } from "@/lib/server/supremacyControl";
import { verifyProductMedia } from "@/lib/server/mediaIntegrity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const AUTHORITATIVE_MEDIA_SOURCE = "salora_catalog_photography_v1";

export async function GET(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "catalog:read");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const productSlug = request.nextUrl.searchParams.get("productSlug") ?? undefined;
    const { take, skip } = pagination(request, { limit: 100, maxLimit: 100 });
    const productWhere = productSlug ? { product: { slug: productSlug } } : {};
    const [images, drafts, summary] = await Promise.all([
      repo.productImages.findMany({ take, skip, where: { ...productWhere, deletedAt: null }, include: { product: true }, orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] }),
      repo.mediaDrafts.findMany({ take, skip, where: { ...productWhere, archivedAt: null }, include: { product: true }, orderBy: [{ createdAt: "desc" }] }),
      repo.cms.run(async (db) => {
        // `cms.run` is one RLS transaction. Reads inside it must be sequential;
        // the two sibling repository calls above use separate transactions and
        // may still run in parallel safely.
        const catalogProducts = await db.catalogProduct.findMany({
          where: { brandKey: "SALORA" },
          select: { id: true, status: true }
        });
        const activeDrafts = await db.productMediaDraft.findMany({
          where: { archivedAt: null, product: { brandKey: "SALORA" } },
          select: { id: true, productId: true, source: true, status: true }
        });
        const liveImages = await db.productImage.findMany({
          where: { deletedAt: null, product: { brandKey: "SALORA" } },
          select: { id: true, productId: true, isPrimary: true }
        });
        const authoritative = activeDrafts.filter((draft: { source: string }) => draft.source === AUTHORITATIVE_MEDIA_SOURCE);
        const authoritativeProductIds = new Set(authoritative.map((draft: { productId: string }) => draft.productId));
        const activeProductIds = new Set(
          catalogProducts
            .filter((product: { status: string }) => product.status === "ACTIVE")
            .map((product: { id: string }) => product.id)
        );
        const liveProductIds = new Set(liveImages.map((image: { productId: string }) => image.productId));
        const imageCounts = liveImages.reduce((counts: Map<string, number>, image: { productId: string }) => {
          counts.set(image.productId, (counts.get(image.productId) ?? 0) + 1);
          return counts;
        }, new Map<string, number>());
        const primaryCounts = liveImages.reduce((counts: Map<string, number>, image: { productId: string; isPrimary: boolean }) => {
          if (image.isPrimary) counts.set(image.productId, (counts.get(image.productId) ?? 0) + 1);
          return counts;
        }, new Map<string, number>());
        const statusCounts = authoritative.reduce((counts: Record<string, number>, draft: { status: string }) => {
          counts[draft.status] = (counts[draft.status] ?? 0) + 1;
          return counts;
        }, {});
        const activeProductsWithLiveImages = [...activeProductIds].filter((productId) => liveProductIds.has(productId)).length;
        return {
          catalogProducts: catalogProducts.length,
          activeCatalogProducts: activeProductIds.size,
          draftRecords: activeDrafts.length,
          authoritativeRecords: authoritative.length,
          authoritativeProducts: authoritativeProductIds.size,
          productsMissingAuthoritative: catalogProducts.length - authoritativeProductIds.size,
          activeProductsMissingAuthoritative: [...activeProductIds].filter((productId) => !authoritativeProductIds.has(productId)).length,
          otherRecords: activeDrafts.length - authoritative.length,
          duplicateAuthoritativeRecords: authoritative.length - authoritativeProductIds.size,
          liveImageRecords: liveImages.length,
          liveImageProducts: liveProductIds.size,
          activeProductsWithLiveImages,
          activeProductsWithoutLiveImages: activeProductIds.size - activeProductsWithLiveImages,
          productsWithoutLiveImages: catalogProducts.length - liveProductIds.size,
          productsWithMultipleLiveImages: [...imageCounts.values()].filter((count) => count > 1).length,
          productsWithNoPrimaryImage: [...liveProductIds].filter((productId) => (primaryCounts.get(productId) ?? 0) === 0).length,
          productsWithMultiplePrimaryImages: [...liveProductIds].filter((productId) => (primaryCounts.get(productId) ?? 0) > 1).length,
          authoritativeStatusCounts: statusCounts
        };
      })
    ]);
    return responseJson({ images, drafts, summary }, id);
  } catch (error) {
    return handleError(error, id);
  }
}

async function mutate(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "catalog:write");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const parsed = await parseBody(request, mediaMutationSchema);
    if (!parsed.success) return responseError("Invalid media mutation payload.", id);
    const input = parsed.data;

    if (input.action === "generate-image-prompt") {
      const { product, draft } = await runProductAiDraft({ operation: "image_prompt", productSlug: input.productSlug, notes: input.notes }, { userId: actor.sub, roles: actor.roles });
      const record = await repo.mediaDrafts.create({
        productId: product.id,
        source: "ai_prompt",
        prompt: draft.answer,
        metadata: { provider: draft.provider, correlationId: draft.correlationId, draftOnly: true, requestId: id }
      });
      await writeActivity({ actorId: actor.sub, action: "media.promptDraft", entityType: "ProductMediaDraft", entityId: record.id, requestId: id, metadata: { productSlug: product.slug } }, repo);
      await writeAudit({ actorId: actor.sub, action: "CREATE", entityType: "ProductMediaDraft", entityId: record.id, after: record, requestId: id, reason: "AI image prompt draft generated; not published" }, repo);
      return responseJson(record, id, 201);
    }

    if (input.action === "create-draft") {
      const product = await repo.products.findUnique({ slug: input.productSlug });
      if (!product) return responseError("Product not found.", id, 404);
      const draft = await repo.mediaDrafts.create({
        productId: product.id,
        source: input.source,
        storageBucket: input.storageBucket,
        storagePath: input.storagePath,
        publicUrl: input.publicUrl,
        prompt: input.prompt,
        altText: input.altText,
        sortOrder: input.sortOrder,
        isPrimaryCandidate: input.isPrimaryCandidate,
        metadata: { draftOnly: true, requestId: id, mimeType: input.mimeType, width: input.width, height: input.height, fileSize: input.fileSize, checksum: input.checksum, altTextAr: input.altTextAr, altTextEn: input.altTextEn }
      });
      await writeActivity({ actorId: actor.sub, action: "media.draftCreate", entityType: "ProductMediaDraft", entityId: draft.id, requestId: id, metadata: { productSlug: product.slug } }, repo);
      await writeAudit({ actorId: actor.sub, action: "CREATE", entityType: "ProductMediaDraft", entityId: draft.id, after: draft, requestId: id }, repo);
      return responseJson(draft, id, 201);
    }

    if (input.action === "approve-draft" || input.action === "reject-draft" || input.action === "archive-draft" || input.action === "publish-draft") {
      const before = await repo.mediaDrafts.findUnique({ id: input.draftId }, { product: true });
      if (!before) return responseError("Media draft not found.", id, 404);
      if (input.action === "publish-draft") {
        if (before.status !== "APPROVED") return responseError("Only approved media drafts can be published.", id, 409);
        if (!before.storagePath || !before.publicUrl) return responseError("Approved draft has no certified storage path and URL.", id, 409);
        const metadata = before.metadata as Record<string, unknown> | null;
        if (!metadata || typeof metadata.mimeType !== "string" || typeof metadata.width !== "number" || typeof metadata.height !== "number" || typeof metadata.fileSize !== "number" || typeof metadata.checksum !== "string" || typeof metadata.altTextAr !== "string" || typeof metadata.altTextEn !== "string") {
          return responseError("Approved draft is missing certified media integrity metadata.", id, 409);
        }
        const verified = await verifyProductMedia({ storageBucket: before.storageBucket, storagePath: before.storagePath, publicUrl: before.publicUrl, mimeType: metadata.mimeType as "image/webp" | "image/avif", width: metadata.width, height: metadata.height, fileSize: metadata.fileSize, checksum: metadata.checksum });
        if (before.isPrimaryCandidate) await repo.productImages.updateMany({ productId: before.productId }, { isPrimary: false });
        const image = await repo.productImages.create({
          productId: before.productId,
          storageBucket: before.storageBucket,
          storagePath: before.storagePath,
          publicUrl: before.publicUrl,
          altText: before.altText,
          sortOrder: before.sortOrder,
          isPrimary: before.isPrimaryCandidate,
          metadata: { sourceDraftId: before.id, source: before.source, ...metadata, ...verified }
        });
        const after = await repo.mediaDrafts.update({ id: before.id }, { status: "PUBLISHED", publishedAt: new Date(), reviewedBy: actor.sub });
        await writeActivity({ actorId: actor.sub, action: "media.publish", entityType: "ProductImage", entityId: image.id, requestId: id, metadata: { draftId: before.id } }, repo);
        await writeAudit({ actorId: actor.sub, action: "APPROVE", entityType: "ProductMediaDraft", entityId: before.id, before, after, requestId: id, reason: "Approved media draft published to ProductImage" }, repo);
        return responseJson({ draft: after, image }, id);
      }
      const data =
        input.action === "approve-draft" ? { status: "APPROVED", approvedAt: new Date(), reviewedBy: actor.sub } :
        input.action === "reject-draft" ? { status: "REJECTED", rejectedAt: new Date(), reviewedBy: actor.sub, metadata: { ...(before.metadata ?? {}), rejectionReason: input.reason } } :
        { status: "ARCHIVED", archivedAt: new Date(), reviewedBy: actor.sub };
      const after = await repo.mediaDrafts.update({ id: before.id }, data);
      await writeActivity({ actorId: actor.sub, action: `media.${input.action}`, entityType: "ProductMediaDraft", entityId: after.id, requestId: id }, repo);
      await writeAudit({ actorId: actor.sub, action: input.action === "approve-draft" ? "APPROVE" : input.action === "reject-draft" ? "REJECT" : "ARCHIVE", entityType: "ProductMediaDraft", entityId: after.id, before, after, requestId: id }, repo);
      return responseJson(after, id);
    }

    if (input.action === "reorder-images") {
      const product = await repo.products.findUnique({ slug: input.productSlug });
      if (!product) return responseError("Product not found.", id, 404);
      await Promise.all(input.imageIds.map((imageId, index) => repo.productImages.update({ id: imageId }, { sortOrder: index })));
      await writeActivity({ actorId: actor.sub, action: "media.reorder", entityType: "CatalogProduct", entityId: product.id, requestId: id, metadata: { imageIds: input.imageIds } }, repo);
      await writeAudit({ actorId: actor.sub, action: "UPDATE", entityType: "CatalogProduct", entityId: product.id, requestId: id, reason: "Product image gallery reordered" }, repo);
      return responseJson({ reordered: input.imageIds.length }, id);
    }

    const imageInput = input;
    const before = await repo.productImages.findUnique({ id: imageInput.imageId });
    if (!before) return responseError("Product image not found.", id, 404);
    if (imageInput.action === "set-primary") {
      await repo.productImages.updateMany({ productId: before.productId }, { isPrimary: false });
      const after = await repo.productImages.update({ id: before.id }, { isPrimary: true });
      await writeActivity({ actorId: actor.sub, action: "media.primary", entityType: "ProductImage", entityId: after.id, requestId: id }, repo);
      await writeAudit({ actorId: actor.sub, action: "UPDATE", entityType: "ProductImage", entityId: after.id, before, after, requestId: id }, repo);
      return responseJson(after, id);
    }
    if (imageInput.action === "replace-image") {
      const verified = await verifyProductMedia(imageInput);
      const after = await repo.productImages.update({ id: before.id }, { storageBucket: imageInput.storageBucket, storagePath: imageInput.storagePath, publicUrl: imageInput.publicUrl, altText: imageInput.altTextEn, metadata: { mimeType: imageInput.mimeType, width: imageInput.width, height: imageInput.height, fileSize: imageInput.fileSize, checksum: imageInput.checksum, altTextAr: imageInput.altTextAr, altTextEn: imageInput.altTextEn, ...verified } });
      await writeActivity({ actorId: actor.sub, action: "media.replace", entityType: "ProductImage", entityId: after.id, requestId: id }, repo);
      await writeAudit({ actorId: actor.sub, action: "UPDATE", entityType: "ProductImage", entityId: after.id, before, after, requestId: id }, repo);
      return responseJson(after, id);
    }
    const after = await repo.productImages.update({ id: before.id }, { archivedAt: new Date(), isPrimary: false });
    await writeActivity({ actorId: actor.sub, action: "media.archive", entityType: "ProductImage", entityId: after.id, requestId: id }, repo);
    await writeAudit({ actorId: actor.sub, action: "ARCHIVE", entityType: "ProductImage", entityId: after.id, before, after, requestId: id }, repo);
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
