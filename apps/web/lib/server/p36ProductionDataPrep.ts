import { withPrismaAuthContextTx } from "@salora/backend/database/rls-context";
import type { Prisma } from "@salora/backend/database/generated/client";
import {
  p36ActivationCandidates,
  p36CandidateProductIds,
  p36MediaApproval,
  p36MediaSpecification,
  p36PriceApproval,
  p36ProductionDataPrepApproval
} from "@/lib/control-tower/p36ActivationManifest";
import { verifyProductMedia, verifyProductMediaBytes } from "@/lib/server/mediaIntegrity";

const EXPECTED_PRODUCTION_PROJECT_REF = "xikqnzvfnquiqyybkyvw";
const MEDIA_BUCKET = "salora-product-media";
const MEDIA_SOURCE = "p36_owner_approved";
const ADVISORY_LOCK_KEY = "salora:p36:production-data-prep";

type StorageResult = {
  slug: string;
  storagePath: string;
  publicUrl: string;
  action: "uploaded" | "reused";
  verifiedAt: string;
};

function storageConfig() {
  const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl || !secretKey) throw new Error("Production Supabase Storage credentials are not configured.");
  const url = new URL(rawUrl);
  if (url.protocol !== "https:" || url.hostname !== `${EXPECTED_PRODUCTION_PROJECT_REF}.supabase.co`) {
    throw new Error("Production Supabase binding does not match the certified P36 project.");
  }
  return { baseUrl: url.origin, secretKey };
}

function encodedObjectPath(path: string) {
  if (path.startsWith("/") || path.includes("..") || path.includes("\\")) throw new Error("Unsafe media storage path.");
  return path.split("/").map(encodeURIComponent).join("/");
}

function publicObjectUrl(baseUrl: string, path: string) {
  return `${baseUrl}/storage/v1/object/public/${MEDIA_BUCKET}/${encodedObjectPath(path)}`;
}

function productionAssetOrigin(requestOrigin: string) {
  const request = new URL(requestOrigin);
  if (request.protocol !== "https:") throw new Error("P36 Production request origin must use HTTPS.");
  const configuredHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!configuredHost || configuredHost.includes("/") || configuredHost.includes("\\")) {
    throw new Error("Certified Vercel Production asset origin is not configured.");
  }
  return `https://${configuredHost}`;
}

async function candidateBytes(sourceOrigin: string, candidate: (typeof p36ActivationCandidates)[number]) {
  const origin = new URL(sourceOrigin);
  if (origin.protocol !== "https:") throw new Error("P36 candidate source must use HTTPS.");
  const sourceUrl = new URL(candidate.imagePath, origin);
  if (sourceUrl.origin !== origin.origin || !sourceUrl.pathname.startsWith("/products/p36-media-candidates/")) {
    throw new Error("P36 candidate source path is not permitted.");
  }
  const response = await fetch(sourceUrl, { redirect: "error", signal: AbortSignal.timeout(10_000), cache: "no-store" });
  if (!response.ok) throw new Error(`Approved P36 media source is unavailable for ${candidate.slug}.`);
  const contentType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== p36MediaSpecification.mimeType) throw new Error(`Approved P36 media MIME mismatch for ${candidate.slug}.`);
  const bytes = Buffer.from(await response.arrayBuffer());
  verifyProductMediaBytes(bytes, {
    mimeType: p36MediaSpecification.mimeType,
    width: p36MediaSpecification.width,
    height: p36MediaSpecification.height,
    fileSize: candidate.imageBytes,
    checksum: candidate.imageSha256
  });
  return bytes;
}

async function ensureStoredMedia(sourceOrigin: string): Promise<StorageResult[]> {
  const { baseUrl, secretKey } = storageConfig();
  const results: StorageResult[] = [];

  for (const candidate of p36ActivationCandidates) {
    const bytes = await candidateBytes(sourceOrigin, candidate);
    const storagePath = `salora/products/${candidate.slug}/${candidate.imageSha256.slice(0, 16)}.webp`;
    const publicUrl = publicObjectUrl(baseUrl, storagePath);
    let action: StorageResult["action"] = "reused";
    const existing = await fetch(publicUrl, { redirect: "error", signal: AbortSignal.timeout(10_000), cache: "no-store" });

    if (existing.status === 404) {
      const uploadUrl = `${baseUrl}/storage/v1/object/${MEDIA_BUCKET}/${encodedObjectPath(storagePath)}`;
      const upload = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          apikey: secretKey,
          authorization: `Bearer ${secretKey}`,
          "content-type": p36MediaSpecification.mimeType,
          "cache-control": "31536000, immutable",
          "x-upsert": "false"
        },
        body: bytes,
        redirect: "error",
        signal: AbortSignal.timeout(15_000)
      });
      if (!upload.ok) {
        const concurrent = await fetch(publicUrl, { redirect: "error", signal: AbortSignal.timeout(10_000), cache: "no-store" });
        if (!concurrent.ok) throw new Error(`Supabase Storage upload failed safely for ${candidate.slug}.`);
      } else {
        action = "uploaded";
      }
    } else if (!existing.ok) {
      throw new Error(`Supabase Storage preflight failed for ${candidate.slug}.`);
    }

    const verified = await verifyProductMedia({
      storageBucket: MEDIA_BUCKET,
      storagePath,
      publicUrl,
      mimeType: p36MediaSpecification.mimeType,
      width: p36MediaSpecification.width,
      height: p36MediaSpecification.height,
      fileSize: candidate.imageBytes,
      checksum: candidate.imageSha256
    });
    results.push({ slug: candidate.slug, storagePath, publicUrl, action, verifiedAt: verified.verifiedAt });
  }

  return results;
}

export async function prepareP36ProductionData(params: { sourceOrigin: string; actorId: string; roles: string[]; requestId: string }) {
  if (process.env.VERCEL_ENV !== "production") throw new Error("P36 Production data preparation is disabled outside Production.");
  if (!params.roles.includes("ADMIN")) throw new Error("P36 Production data preparation requires Admin authorization.");
  if (!p36MediaApproval.productionUploadAuthorized || p36ProductionDataPrepApproval.activationAuthorized) {
    throw new Error("P36 Production data preparation approval is invalid.");
  }

  const storage = await ensureStoredMedia(productionAssetOrigin(params.sourceOrigin));
  const storedBySlug = new Map(storage.map((item) => [item.slug, item]));
  const transaction = await withPrismaAuthContextTx({ userId: params.actorId, roles: params.roles }, async (tx) => {
    await tx.$executeRaw`select pg_advisory_xact_lock(hashtextextended(${ADVISORY_LOCK_KEY}, 0))`;
    const products = await tx.catalogProduct.findMany({
      where: { brandKey: "SALORA", slug: { in: p36ActivationCandidates.map((candidate) => candidate.slug) } },
      include: { images: { where: { deletedAt: null, archivedAt: null } }, mediaDrafts: { where: { archivedAt: null } } }
    });
    if (products.length !== p36ActivationCandidates.length) throw new Error("P36 Product ID gate failed.");

    const now = new Date();
    const draftRows: Prisma.ProductMediaDraftCreateManyInput[] = [];
    const imageRows: Prisma.ProductImageCreateManyInput[] = [];
    const auditRows: Prisma.AuditLogCreateManyInput[] = [];
    const activityRows: Prisma.ActivityLogCreateManyInput[] = [];
    const priceUpdates: Array<{ slug: string; approvedPrice: number }> = [];
    const seedDraftIds: string[] = [];

    for (const candidate of p36ActivationCandidates) {
      const product = products.find((item) => item.slug === candidate.slug);
      const stored = storedBySlug.get(candidate.slug);
      if (!product || !stored || product.id !== p36CandidateProductIds[candidate.slug]) throw new Error(`P36 Product identity gate failed for ${candidate.slug}.`);
      if (product.status !== "DRAFT") throw new Error(`P36 status gate failed for ${candidate.slug}.`);
      const currentPrice = Number(product.basePrice);
      if (currentPrice !== 0 && currentPrice !== candidate.approvedPrice) throw new Error(`P36 price conflict detected for ${candidate.slug}.`);

      const exactImage = product.images.find((image) => {
        const metadata = image.metadata as Record<string, unknown> | null;
        return image.storagePath === stored.storagePath && metadata?.checksum === candidate.imageSha256;
      });
      if (product.images.some((image) => image.id !== exactImage?.id)) throw new Error(`Unexpected live ProductImage conflict for ${candidate.slug}.`);

      const exactDraft = product.mediaDrafts.find((draft) => draft.source === MEDIA_SOURCE && draft.storagePath === stored.storagePath && draft.status === "PUBLISHED");
      const mediaMetadata = {
        mimeType: p36MediaSpecification.mimeType,
        width: p36MediaSpecification.width,
        height: p36MediaSpecification.height,
        fileSize: candidate.imageBytes,
        checksum: candidate.imageSha256,
        altTextAr: candidate.altAr,
        altTextEn: candidate.altEn,
        approvalToken: p36MediaApproval.token,
        dataPrepApprovalToken: p36ProductionDataPrepApproval.token,
        approvalSource: p36MediaApproval.source,
        verifiedAt: stored.verifiedAt
      };

      let draftId = exactDraft?.id;
      if (!draftId) {
        draftId = crypto.randomUUID();
        draftRows.push({
          id: draftId,
          productId: product.id,
          status: "PUBLISHED",
          source: MEDIA_SOURCE,
          storageBucket: MEDIA_BUCKET,
          storagePath: stored.storagePath,
          publicUrl: stored.publicUrl,
          altText: candidate.altEn,
          sortOrder: 0,
          isPrimaryCandidate: true,
          metadata: mediaMetadata,
          reviewedBy: params.actorId,
          approvedAt: new Date(p36MediaApproval.approvedAt),
          publishedAt: now
        });
        auditRows.push({ actorId: params.actorId, action: "APPROVE", entityType: "ProductMediaDraft", entityId: draftId, after: { productSlug: candidate.slug, ...mediaMetadata }, requestId: params.requestId, reason: "Owner-approved P36 media published after byte-level verification" });
      }

      if (!exactImage) {
        const imageId = crypto.randomUUID();
        imageRows.push({ id: imageId, productId: product.id, storageBucket: MEDIA_BUCKET, storagePath: stored.storagePath, publicUrl: stored.publicUrl, altText: candidate.altEn, sortOrder: 0, isPrimary: true, metadata: { sourceDraftId: draftId, source: MEDIA_SOURCE, ...mediaMetadata } });
        auditRows.push({ actorId: params.actorId, action: "CREATE", entityType: "ProductImage", entityId: imageId, after: { productSlug: candidate.slug, storagePath: stored.storagePath, checksum: candidate.imageSha256 }, requestId: params.requestId, reason: "P36 approved ProductImage created from verified Supabase Storage object" });
      }

      for (const draft of product.mediaDrafts.filter((item) => item.source === "seed_catalog" && item.status === "DRAFT")) seedDraftIds.push(draft.id);
      if (currentPrice !== candidate.approvedPrice) {
        priceUpdates.push({ slug: candidate.slug, approvedPrice: candidate.approvedPrice });
        auditRows.push({ actorId: params.actorId, action: "UPDATE", entityType: "CatalogProduct", entityId: product.id, before: { slug: candidate.slug, basePrice: currentPrice.toFixed(3) }, after: { slug: candidate.slug, basePrice: candidate.approvedPrice.toFixed(3), currency: p36PriceApproval.currency }, requestId: params.requestId, reason: p36PriceApproval.source });
      }
      if (!exactDraft || !exactImage || currentPrice !== candidate.approvedPrice) {
        activityRows.push({ actorId: params.actorId, actorType: "user", action: "p36.productionDataPrep", entityType: "CatalogProduct", entityId: product.id, requestId: params.requestId, metadata: { slug: candidate.slug, mediaCreated: !exactImage, priceChanged: currentPrice !== candidate.approvedPrice } });
      }
    }

    if (draftRows.length) await tx.productMediaDraft.createMany({ data: draftRows });
    if (imageRows.length) await tx.productImage.createMany({ data: imageRows });
    if (seedDraftIds.length) {
      await tx.productMediaDraft.updateMany({ where: { id: { in: seedDraftIds }, archivedAt: null }, data: { status: "ARCHIVED", archivedAt: now, reviewedBy: params.actorId } });
      for (const draftId of seedDraftIds) auditRows.push({ actorId: params.actorId, action: "ARCHIVE", entityType: "ProductMediaDraft", entityId: draftId, requestId: params.requestId, reason: "Seed placeholder superseded by owner-approved P36 media" });
    }
    for (const update of priceUpdates) await tx.catalogProduct.update({ where: { slug: update.slug }, data: { basePrice: update.approvedPrice } });
    if (auditRows.length) await tx.auditLog.createMany({ data: auditRows });
    if (activityRows.length) await tx.activityLog.createMany({ data: activityRows });

    const verified = await tx.catalogProduct.findMany({
      where: { slug: { in: p36ActivationCandidates.map((candidate) => candidate.slug) } },
      select: { slug: true, status: true, basePrice: true, images: { where: { deletedAt: null, archivedAt: null }, select: { id: true, storagePath: true, metadata: true } } }
    });
    const allReadyForActivationReview = verified.every((product) => {
      const candidate = p36ActivationCandidates.find((item) => item.slug === product.slug);
      const image = product.images[0];
      const metadata = image?.metadata as Record<string, unknown> | null;
      return candidate && product.status === "DRAFT" && Number(product.basePrice) === candidate.approvedPrice && product.images.length === 1 && metadata?.checksum === candidate.imageSha256;
    });
    if (!allReadyForActivationReview) throw new Error("P36 post-write readiness verification failed; transaction rolled back.");

    return { draftsCreated: draftRows.length, imagesCreated: imageRows.length, pricesChanged: priceUpdates.length, seedDraftsArchived: seedDraftIds.length, auditRecordsCreated: auditRows.length, activityRecordsCreated: activityRows.length, readyProducts: verified.length };
  });

  return {
    authorization: p36ProductionDataPrepApproval.token,
    storage: { uploaded: storage.filter((item) => item.action === "uploaded").length, reused: storage.filter((item) => item.action === "reused").length, verified: storage.length },
    database: transaction,
    activationPerformed: false,
    revisionPublished: false,
    candidates: storage.map((item) => ({ slug: item.slug, storagePath: item.storagePath, action: item.action }))
  };
}
