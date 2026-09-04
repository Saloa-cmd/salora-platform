import { withPrismaAuthContextTx } from "@salora/backend/database/rls-context";
import { buildMenuRevisionSnapshot } from "@salora/backend/domains/menu-collections/revision-contract";
import { checksumSnapshot } from "@salora/backend/domains/menu-collections/service";
import { p36ActivationCandidates, p36CandidateProductIds } from "@/lib/control-tower/p36ActivationManifest";
import { assessProductOrderability } from "@/lib/server/orderability";

const EXPECTED_PRODUCTION_PROJECT_REF = "xikqnzvfnquiqyybkyvw";
const COLLECTION_SLUG = "salora-menu";
const PUBLICATION_KEY = "salora-menu-production-v2";
const ADVISORY_LOCK_KEY = "salora:p36:activate117";

function assertProductionBinding() {
  if (process.env.VERCEL_ENV !== "production") throw new Error("ACTIVATE117 is disabled outside Production.");
  const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!rawUrl || new URL(rawUrl).hostname !== `${EXPECTED_PRODUCTION_PROJECT_REF}.supabase.co`) {
    throw new Error("ACTIVATE117 Production binding does not match the certified Supabase project.");
  }
}

const productInclude = {
  category: true,
  nutritionProfile: true,
  allergenProfile: true,
  images: { where: { deletedAt: null, archivedAt: null }, orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }] },
  variants: { orderBy: { name: "asc" as const } },
  addons: { orderBy: { name: "asc" as const } },
  modifiers: { orderBy: { name: "asc" as const } },
  pricingRules: true,
  availabilityRules: true
};

function assertCandidateReady(product: any) {
  const candidate = p36ActivationCandidates.find((item) => item.slug === product.slug);
  const image = product.images[0];
  const metadata = image?.metadata as Record<string, unknown> | null;
  if (!candidate || product.id !== p36CandidateProductIds[product.slug]) throw new Error(`P36 identity gate failed for ${product.slug}.`);
  if (Number(product.basePrice) !== candidate.approvedPrice) throw new Error(`P36 approved price is not prepared for ${product.slug}.`);
  if (product.images.length !== 1 || metadata?.checksum !== candidate.imageSha256) throw new Error(`P36 approved media is not prepared for ${product.slug}.`);
  const readiness = assessProductOrderability({ ...product, status: "ACTIVE" });
  if (!readiness.orderReady) throw new Error(`P36 readiness gate failed for ${product.slug}: ${readiness.reasons.join(",")}.`);
}

export async function activate117AndPublishV2(params: { actorId: string; roles: string[]; requestId: string }) {
  assertProductionBinding();
  if (!params.roles.includes("ADMIN")) throw new Error("ACTIVATE117 requires Admin authorization.");

  return withPrismaAuthContextTx({ userId: params.actorId, roles: params.roles }, async (tx) => {
    await tx.$executeRaw`select pg_advisory_xact_lock(hashtextextended(${ADVISORY_LOCK_KEY}, 0))`;

    const existingPublication = await tx.menuPublication.findUnique({
      where: { publicationKey: PUBLICATION_KEY },
      include: { revision: true, collection: true }
    });
    if (existingPublication) {
      const activeCount = await tx.catalogProduct.count({ where: { brandKey: "SALORA", status: "ACTIVE" } });
      const totalCount = await tx.catalogProduct.count({ where: { brandKey: "SALORA" } });
      if (existingPublication.status !== "PUBLISHED" || existingPublication.revision.version !== 2 || existingPublication.collection.activeRevisionId !== existingPublication.revisionId || activeCount !== 117 || totalCount !== 117) {
        throw new Error("ACTIVATE117 idempotency conflict: an incomplete v2 publication already exists.");
      }
      return { alreadyApplied: true, activeProducts: activeCount, orderReadyProducts: activeCount, revisionId: existingPublication.revisionId, publicationId: existingPublication.id };
    }

    const products = await tx.catalogProduct.findMany({ where: { brandKey: "SALORA" }, include: productInclude });
    if (products.length !== 117) throw new Error(`ACTIVATE117 expected 117 SALORA products, found ${products.length}.`);
    const candidates = products.filter((product) => p36ActivationCandidates.some((item) => item.slug === product.slug));
    if (candidates.length !== 13 || candidates.some((product) => product.status !== "DRAFT")) throw new Error("ACTIVATE117 requires exactly 13 certified DRAFT candidates.");
    if (products.filter((product) => product.status === "ACTIVE").length !== 104) throw new Error("ACTIVATE117 baseline must contain exactly 104 ACTIVE products.");
    for (const product of candidates) assertCandidateReady(product);

    const now = new Date();
    const activated = await tx.catalogProduct.updateMany({
      where: { id: { in: candidates.map((product) => product.id) }, status: "DRAFT" },
      data: { status: "ACTIVE", updatedAt: now }
    });
    if (activated.count !== 13) throw new Error("ACTIVATE117 concurrent edit detected; transaction rolled back.");

    const collection = await tx.menuCollection.findFirst({
      where: { brandKey: "SALORA", slug: COLLECTION_SLUG, archivedAt: null },
      include: {
        sections: { where: { archivedAt: null }, orderBy: { sortOrder: "asc" } },
        products: { where: { archivedAt: null }, orderBy: { sortOrder: "asc" }, include: { product: { include: productInclude } } }
      }
    });
    if (!collection || collection.products.length !== 117 || collection.completenessScore !== 100) throw new Error("ACTIVATE117 Menu Authority collection is not complete for 117 products.");
    if (collection.products.some((membership) => membership.product.status !== "ACTIVE")) throw new Error("ACTIVATE117 collection contains a non-active product after activation.");
    const readiness = collection.products.map((membership) => assessProductOrderability(membership.product));
    const blocked = readiness.filter((item) => !item.orderReady);
    if (blocked.length) throw new Error(`ACTIVATE117 order-readiness failed for ${blocked.map((item) => item.productSlug).join(",")}.`);

    const latest = await tx.menuCollectionRevision.findFirst({ where: { collectionId: collection.id }, orderBy: { version: "desc" } });
    if (!latest || latest.version !== 1 || latest.status !== "PUBLISHED" || collection.activeRevisionId !== latest.id) throw new Error("ACTIVATE117 requires immutable published Revision v1 as the rollback baseline.");

    const snapshot = buildMenuRevisionSnapshot(collection);
    if (!Array.isArray(snapshot.products) || snapshot.products.length !== 117) throw new Error("ACTIVATE117 v2 snapshot does not contain 117 products.");
    const revision = await tx.menuCollectionRevision.create({
      data: { collectionId: collection.id, version: 2, status: "PUBLISHED", snapshot, checksum: checksumSnapshot(snapshot), changeSummary: "P36 ACTIVATE117: 13 approved products activated with certified prices and media.", createdBy: params.actorId }
    });
    const publication = await tx.menuPublication.create({
      data: { collectionId: collection.id, revisionId: revision.id, publicationKey: PUBLICATION_KEY, status: "PUBLISHED", channels: ["WEB", "DIGITAL_MENU", "MOBILE"], startedAt: now, publishedAt: now, completedAt: now, smokeTestStatus: "PENDING", createdBy: params.actorId }
    });
    await tx.menuCollection.update({ where: { id: collection.id }, data: { activeRevisionId: revision.id, status: "PUBLISHED", publishedAt: now, updatedBy: params.actorId } });

    await tx.auditLog.createMany({ data: [
      ...candidates.map((product) => ({ actorId: params.actorId, action: "APPROVE" as const, entityType: "CatalogProduct", entityId: product.id, before: { slug: product.slug, status: "DRAFT" }, after: { slug: product.slug, status: "ACTIVE" }, requestId: params.requestId, reason: "Owner-authorized ACTIVATE117 atomic activation" })),
      { actorId: params.actorId, action: "CREATE" as const, entityType: "MenuCollectionRevision", entityId: revision.id, after: { version: 2, checksum: revision.checksum, products: 117 }, requestId: params.requestId, reason: "ACTIVATE117 immutable Revision v2" },
      { actorId: params.actorId, action: "APPROVE" as const, entityType: "MenuPublication", entityId: publication.id, after: { revisionId: revision.id, channels: publication.channels }, requestId: params.requestId, reason: "ACTIVATE117 atomic multi-channel publication" }
    ] });
    await tx.activityLog.create({ data: { actorId: params.actorId, actorType: "user", action: "p36.activate117", entityType: "MenuPublication", entityId: publication.id, requestId: params.requestId, metadata: { activatedProducts: 13, revisionVersion: 2, channels: publication.channels } } });

    const activeProducts = await tx.catalogProduct.count({ where: { brandKey: "SALORA", status: "ACTIVE" } });
    const invalidPrices = await tx.catalogProduct.count({ where: { brandKey: "SALORA", basePrice: { lte: 0 } } });
    const liveImageProducts = await tx.productImage.groupBy({ by: ["productId"], where: { product: { brandKey: "SALORA" }, archivedAt: null, deletedAt: null } });
    if (activeProducts !== 117 || invalidPrices !== 0 || liveImageProducts.length !== 117) throw new Error("ACTIVATE117 post-write verification failed; transaction rolled back.");

    return { alreadyApplied: false, activatedProducts: activated.count, activeProducts, orderReadyProducts: readiness.length, validPrices: 117, liveImageProducts: liveImageProducts.length, revisionId: revision.id, revisionVersion: revision.version, publicationId: publication.id, publicationKey: publication.publicationKey, channels: publication.channels, rollbackRevisionId: latest.id };
  });
}
