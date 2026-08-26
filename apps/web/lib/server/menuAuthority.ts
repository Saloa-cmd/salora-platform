import { revalidateTag, unstable_cache } from "next/cache";
import type {
  MenuAuthoritySection,
  MenuAuthoritySnapshot,
  MenuAuthoritySource,
  Product,
  ProductAllergenSummary,
  ProductNutritionSummary
} from "@salora/types";
import {
  SYSTEM_AUTH_CONTEXT,
  isRetryableDatabaseConnectivityError,
  isMenuRevisionContractV2,
  withDatabaseReadRecovery,
  withPrismaAuthContext
} from "@salora/backend";
import {
  catalogProductIsAvailable,
  currentCatalogPrice,
  normalizeCatalogModifierOptions
} from "./commerceIntegrity";

export const MENU_AUTHORITY_CACHE_TAG = "salora-menu-authority";
export const MENU_AUTHORITY_REVALIDATE_SECONDS = 300;

export class MenuAuthorityUnavailableError extends Error {
  constructor(message = "A published SALORA MenuCollectionRevision is required.") {
    super(message);
    this.name = "MenuAuthorityUnavailableError";
  }
}

type AuthorityMode = "required" | "compat";

type LiveProductOverlay = {
  status?: string;
  images?: Array<{
    productId: string;
    publicUrl?: string | null;
    isPrimary?: boolean;
  }>;
};

const globalMenuAuthority = globalThis as typeof globalThis & {
  saloraMenuAuthorityLastKnownGood?: MenuAuthoritySnapshot;
  saloraMenuAuthorityRefresh?: Promise<MenuAuthoritySnapshot>;
};

function authorityMode(): AuthorityMode {
  return process.env.SALORA_MENU_AUTHORITY_MODE === "required" ? "required" : "compat";
}

function dateOrNull(value: unknown): Date | null {
  if (typeof value !== "string" && !(value instanceof Date)) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function publicImage(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const candidate = record.publicUrl ?? record.url ?? record.src;
  return typeof candidate === "string" && /^https:\/\//i.test(candidate) ? candidate : undefined;
}

function firstPublicImage(images: Array<{ publicUrl?: string | null; isPrimary?: boolean }>): string | undefined {
  return images.find((image) => image.isPrimary && image.publicUrl)?.publicUrl
    ?? images.find((image) => image.publicUrl)?.publicUrl
    ?? undefined;
}

function groupByProductId<T extends { productId: string }>(rows: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const values = grouped.get(row.productId) ?? [];
    values.push(row);
    grouped.set(row.productId, values);
  }
  return grouped;
}

function nutritionSummary(value: any): ProductNutritionSummary | undefined {
  if (!value || value.verificationStatus !== "VERIFIED") return undefined;
  return {
    caloriesKcal: value.caloriesKcal == null ? undefined : Number(value.caloriesKcal),
    proteinG: value.proteinG == null ? undefined : Number(value.proteinG),
    carbohydratesG: value.carbohydratesG == null ? undefined : Number(value.carbohydratesG),
    totalSugarG: value.totalSugarG == null ? undefined : Number(value.totalSugarG),
    fatG: value.fatG == null ? undefined : Number(value.fatG),
    verificationStatus: value.verificationStatus
  };
}

function allergenSummary(value: any): ProductAllergenSummary | undefined {
  if (!value || value.verificationStatus !== "VERIFIED") return undefined;
  return {
    contains: Array.isArray(value.containsAllergens) ? value.containsAllergens : [],
    mayContain: Array.isArray(value.mayContainAllergens) ? value.mayContainAllergens : [],
    warningAr: value.warningAr ?? undefined,
    warningEn: value.warningEn ?? undefined,
    verificationStatus: value.verificationStatus
  };
}

function mapRevisionProduct(
  row: any,
  revisionId: string,
  sectionById: Map<string, MenuAuthoritySection>,
  now: Date,
  liveProduct?: LiveProductOverlay
): Product | null {
  const membership = row?.membership;
  const product = row?.product;
  const liveStatus = liveProduct?.status ?? product?.status;
  if (!membership || !product || liveStatus !== "ACTIVE") return null;

  const availabilityRules = Array.isArray(product.availabilityRules) ? product.availabilityRules : [];
  if (!catalogProductIsAvailable(availabilityRules, now)) return null;

  const pricingRules = (Array.isArray(product.pricingRules) ? product.pricingRules : []).map((rule: any) => ({
    ...rule,
    startsAt: dateOrNull(rule.startsAt),
    endsAt: dateOrNull(rule.endsAt)
  }));
  const snapshotImages = Array.isArray(product.images) ? product.images : [];
  const liveImages = liveProduct?.images ?? [];
  const primaryImage = firstPublicImage(liveImages) ?? firstPublicImage(snapshotImages);
  const section = membership.sectionId ? sectionById.get(membership.sectionId) : undefined;

  return {
    id: product.slug,
    catalogId: product.id,
    menuRevisionId: revisionId,
    sectionKey: section?.key,
    name: membership.titleEnOverride ?? product.nameEn ?? product.name,
    nameAr: membership.titleArOverride ?? product.nameAr ?? undefined,
    nameEn: membership.titleEnOverride ?? product.nameEn ?? product.name,
    category: section?.nameEn ?? product.category?.nameEn ?? product.category?.name ?? "Menu",
    categoryAr: section?.nameAr ?? product.category?.nameAr ?? undefined,
    categoryEn: section?.nameEn ?? product.category?.nameEn ?? product.category?.name ?? undefined,
    description: membership.descriptionEnOverride ?? product.descriptionEn ?? product.description ?? "",
    descriptionAr: membership.descriptionArOverride ?? product.descriptionAr ?? undefined,
    descriptionEn: membership.descriptionEnOverride ?? product.descriptionEn ?? product.description ?? "",
    story: membership.descriptionEnOverride ?? product.descriptionEn ?? product.description ?? "",
    price: currentCatalogPrice(product.basePrice, pricingRules, now),
    tags: Array.from(new Set([...(product.tags ?? []), ...(membership.badges ?? [])])),
    badges: membership.badges ?? [],
    pairing: product.pairingHint ?? undefined,
    visual: primaryImage ?? publicImage(membership.presentationImage) ?? product.slug,
    featured: Boolean(membership.isFeatured),
    variants: (product.variants ?? []).map((variant: any) => ({
      id: variant.id,
      name: variant.name,
      priceDelta: Number(variant.priceDelta ?? 0),
      sku: variant.sku ?? undefined
    })),
    addons: (product.addons ?? []).map((addon: any) => ({
      id: addon.id,
      name: addon.name,
      priceDelta: Number(addon.price ?? 0)
    })),
    modifierGroups: (product.modifiers ?? [])
      .map((modifier: any) => ({
        id: modifier.id,
        name: modifier.name,
        required: Boolean(modifier.required),
        options: normalizeCatalogModifierOptions(modifier.options)
      }))
      .filter((group: any) => group.options.length > 0),
    nutrition: nutritionSummary(product.nutritionProfile),
    allergens: allergenSummary(product.allergenProfile)
  };
}

function revisionAuthority(collection: any): MenuAuthoritySnapshot | null {
  const revision = collection?.activeRevision;
  if (!revision || !isMenuRevisionContractV2(revision.snapshot)) return null;

  const contract = revision.snapshot as any;
  if (contract.collection?.id !== collection.id) return null;

  const sections: MenuAuthoritySection[] = contract.sections
    .filter((section: any) => section && section.isActive !== false)
    .map((section: any) => ({
      id: section.id,
      key: section.key,
      nameAr: section.nameAr,
      nameEn: section.nameEn,
      descriptionAr: section.descriptionAr ?? undefined,
      descriptionEn: section.descriptionEn ?? undefined,
      sortOrder: Number(section.sortOrder ?? 0)
    }))
    .sort((left: MenuAuthoritySection, right: MenuAuthoritySection) => left.sortOrder - right.sortOrder);

  const sectionById = new Map(sections.map((section) => [section.id, section]));
  const liveProductsById = new Map<string, LiveProductOverlay>(
    (collection.liveProducts ?? []).map((product: any) => [
      product.id,
      {
        status: product.status,
        images: collection.liveImagesByProduct?.get(product.id) ?? []
      }
    ])
  );
  const now = new Date();
  const products = contract.products
    .map((row: any) => mapRevisionProduct(
      row,
      revision.id,
      sectionById,
      now,
      liveProductsById.get(row?.product?.id)
    ))
    .filter((product: Product | null): product is Product => Boolean(product));

  const latestPublication = collection.publications?.[0];

  return {
    collection: {
      id: collection.id,
      key: collection.key,
      slug: collection.slug,
      kind: collection.kind,
      nameAr: collection.nameAr,
      nameEn: collection.nameEn
    },
    revision: {
      id: revision.id,
      version: revision.version,
      checksum: revision.checksum,
      publishedAt: latestPublication?.publishedAt?.toISOString?.()
        ?? collection.publishedAt?.toISOString?.()
        ?? revision.createdAt?.toISOString?.()
        ?? new Date().toISOString()
    },
    sections,
    products,
    source: "published-revision",
    stale: false,
    runtimeMode: "live",
    databaseHealth: "available",
    generatedAt: contract.generatedAt ?? revision.createdAt?.toISOString?.() ?? new Date().toISOString()
  };
}

async function readPublishedRevision(): Promise<MenuAuthoritySnapshot | null> {
  return withPrismaAuthContext(SYSTEM_AUTH_CONTEXT, async (database) => {
    const collection = await database.menuCollection.findFirst({
      where: {
        brandKey: "SALORA",
        key: "salora-menu",
        status: "PUBLISHED",
        archivedAt: null,
        activeRevisionId: { not: null }
      }
    });
    if (!collection?.activeRevisionId) return null;

    // Keep transaction-bound Prisma relation reads explicitly sequential until the
    // upstream adapter serializes transaction queries. node-postgres does not
    // support overlapping queries on the same interactive transaction client.
    const activeRevision = await database.menuCollectionRevision.findUnique({
      where: { id: collection.activeRevisionId }
    });
    const latestPublication = await database.menuPublication.findFirst({
      where: { collectionId: collection.id, status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" }
    });
    if (!activeRevision || !isMenuRevisionContractV2(activeRevision.snapshot)) return null;

    const productIds = (activeRevision.snapshot.products as any[])
      .map((row: any) => row?.product?.id)
      .filter((id: unknown): id is string => typeof id === "string" && id.length > 0);

    const liveProducts = productIds.length
      ? await database.catalogProduct.findMany({
        where: { id: { in: productIds }, brandKey: "SALORA" },
        select: { id: true, status: true }
      })
      : [];
    const liveImages = productIds.length
      ? await database.productImage.findMany({
        where: { productId: { in: productIds }, archivedAt: null, deletedAt: null },
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
      })
      : [];
    const liveImagesByProduct = groupByProductId(liveImages);

    return revisionAuthority({
      ...collection,
      activeRevision,
      liveProducts,
      liveImagesByProduct,
      publications: latestPublication ? [latestPublication] : []
    });
  });
}

async function readLegacyCatalog(): Promise<MenuAuthoritySnapshot> {
  return withPrismaAuthContext(SYSTEM_AUTH_CONTEXT, async (database) => {
    const now = new Date();
    const rawProducts = await database.catalogProduct.findMany({
      where: { brandKey: "SALORA", status: "ACTIVE" },
      orderBy: { name: "asc" }
    });
    const productIds = rawProducts.map((product) => product.id);
    const categoryIds = [...new Set(rawProducts.map((product) => product.categoryId))];

    const categoryRows = await database.productCategory.findMany({
      where: { id: { in: categoryIds } },
      orderBy: { sortOrder: "asc" }
    });
    const imageRows = await database.productImage.findMany({
      where: { productId: { in: productIds }, archivedAt: null, deletedAt: null },
      orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
    });
    const variantRows = await database.productVariant.findMany({
      where: { productId: { in: productIds } },
      orderBy: { name: "asc" }
    });
    const addonRows = await database.productAddon.findMany({
      where: { productId: { in: productIds } },
      orderBy: { name: "asc" }
    });
    const modifierRows = await database.productModifier.findMany({
      where: { productId: { in: productIds } },
      orderBy: { name: "asc" }
    });
    const pricingRuleRows = await database.pricingRule.findMany({
      where: { productId: { in: productIds } }
    });
    const availabilityRuleRows = await database.availabilityRule.findMany({
      where: { productId: { in: productIds } }
    });

    const categoryById = new Map(categoryRows.map((category) => [category.id, category]));
    const imagesByProduct = groupByProductId(imageRows);
    const variantsByProduct = groupByProductId(variantRows);
    const addonsByProduct = groupByProductId(addonRows);
    const modifiersByProduct = groupByProductId(modifierRows);
    const pricingRulesByProduct = groupByProductId(pricingRuleRows);
    const availabilityRulesByProduct = groupByProductId(availabilityRuleRows);
    const rows = rawProducts
      .map((product) => ({
        ...product,
        category: categoryById.get(product.categoryId),
        images: imagesByProduct.get(product.id) ?? [],
        variants: variantsByProduct.get(product.id) ?? [],
        addons: addonsByProduct.get(product.id) ?? [],
        modifiers: modifiersByProduct.get(product.id) ?? [],
        pricingRules: pricingRulesByProduct.get(product.id) ?? [],
        availabilityRules: availabilityRulesByProduct.get(product.id) ?? []
      }))
      .sort((left, right) =>
        (left.category?.sortOrder ?? 0) - (right.category?.sortOrder ?? 0)
        || left.name.localeCompare(right.name)
      );

    const categories = new Map<string, MenuAuthoritySection>();
    for (const row of rows) {
      if (!row.category) continue;
      categories.set(row.category.slug, {
        id: row.category.id,
        key: row.category.slug,
        nameAr: row.category.nameAr ?? row.category.name,
        nameEn: row.category.nameEn ?? row.category.name,
        sortOrder: row.category.sortOrder
      });
    }
    const sections = [...categories.values()].sort((left, right) => left.sortOrder - right.sortOrder);
    const products = rows
      .filter((row) => catalogProductIsAvailable(row.availabilityRules, now))
      .map((row): Product => ({
        id: row.slug,
        catalogId: row.id,
        sectionKey: row.category?.slug,
        name: row.nameEn ?? row.name,
        nameAr: row.nameAr ?? undefined,
        nameEn: row.nameEn ?? row.name,
        category: row.category?.nameEn ?? row.category?.name ?? "Menu",
        categoryAr: row.category?.nameAr ?? undefined,
        categoryEn: row.category?.nameEn ?? row.category?.name ?? undefined,
        description: row.descriptionEn ?? row.description,
        descriptionAr: row.descriptionAr ?? undefined,
        descriptionEn: row.descriptionEn ?? row.description,
        story: row.descriptionEn ?? row.description,
        price: currentCatalogPrice(row.basePrice, row.pricingRules, now),
        tags: row.tags,
        pairing: row.pairingHint ?? undefined,
        visual: firstPublicImage(row.images) ?? row.slug,
        variants: row.variants.map((variant) => ({
          id: variant.id,
          name: variant.name,
          priceDelta: Number(variant.priceDelta.toString()),
          sku: variant.sku ?? undefined
        })),
        addons: row.addons.map((addon) => ({
          id: addon.id,
          name: addon.name,
          priceDelta: Number(addon.price.toString())
        })),
        modifierGroups: row.modifiers
          .map((modifier) => ({
            id: modifier.id,
            name: modifier.name,
            required: modifier.required,
            options: normalizeCatalogModifierOptions(modifier.options)
          }))
          .filter((group) => group.options.length > 0)
      }));

    return {
      collection: {
        id: "legacy-catalog",
        key: "legacy-catalog",
        slug: "legacy-catalog",
        kind: "STANDARD",
        nameAr: "منيو سالورا",
        nameEn: "SALORA Menu"
      },
      revision: null,
      sections,
      products,
      source: "legacy-catalog",
      stale: true,
      runtimeMode: "compatibility",
      databaseHealth: "available",
      generatedAt: now.toISOString()
    };
  });
}

async function loadAuthority(): Promise<MenuAuthoritySnapshot> {
  try {
    const authority = await readPublishedRevision();
    if (authority) return authority;
    if (authorityMode() === "required") throw new MenuAuthorityUnavailableError();
    return readLegacyCatalog();
  } catch (error) {
    // Connectivity failures must be recovered at the pool boundary before any
    // compatibility query is attempted. Immediately issuing a second catalog
    // read on the same stale socket amplifies pool starvation.
    if (isRetryableDatabaseConnectivityError(error)) throw error;
    if (error instanceof MenuAuthorityUnavailableError || authorityMode() === "required") throw error;
    return readLegacyCatalog();
  }
}

async function refreshAuthority(): Promise<MenuAuthoritySnapshot> {
  if (!globalMenuAuthority.saloraMenuAuthorityRefresh) {
    globalMenuAuthority.saloraMenuAuthorityRefresh = withDatabaseReadRecovery(
      "menu-authority.refresh",
      loadAuthority
    ).finally(() => {
      globalMenuAuthority.saloraMenuAuthorityRefresh = undefined;
    });
  }

  return globalMenuAuthority.saloraMenuAuthorityRefresh;
}

const cachedAuthority = unstable_cache(
  refreshAuthority,
  ["salora-menu-authority-v4"],
  { revalidate: MENU_AUTHORITY_REVALIDATE_SECONDS, tags: [MENU_AUTHORITY_CACHE_TAG] }
);

export async function getMenuAuthoritySnapshot() {
  try {
    const snapshot = await cachedAuthority();
    globalMenuAuthority.saloraMenuAuthorityLastKnownGood = snapshot;
    return snapshot;
  } catch (error) {
    const lastKnownGood = globalMenuAuthority.saloraMenuAuthorityLastKnownGood;
    if (!lastKnownGood) throw error;

    return {
      ...lastKnownGood,
      stale: true,
      runtimeMode: "offline-cache" as const,
      databaseHealth: "unavailable" as const
    };
  }
}

export function invalidateMenuAuthorityCache() {
  revalidateTag(MENU_AUTHORITY_CACHE_TAG, "max");
}

export function menuAuthorityMode(): AuthorityMode {
  return authorityMode();
}

export type { MenuAuthoritySource };
