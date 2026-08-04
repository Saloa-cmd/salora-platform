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
  isMenuRevisionContractV2,
  withPrismaAuthContext
} from "@salora/backend";
import {
  catalogProductIsAvailable,
  currentCatalogPrice,
  normalizeCatalogModifierOptions
} from "./commerceIntegrity";

export const MENU_AUTHORITY_CACHE_TAG = "salora-menu-authority";
export const MENU_AUTHORITY_REVALIDATE_SECONDS = 60;

export class MenuAuthorityUnavailableError extends Error {
  constructor(message = "A published SALORA MenuCollectionRevision is required.") {
    super(message);
    this.name = "MenuAuthorityUnavailableError";
  }
}

type AuthorityMode = "required" | "compat";

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

function mapRevisionProduct(row: any, revisionId: string, sectionById: Map<string, MenuAuthoritySection>, now: Date): Product | null {
  const membership = row?.membership;
  const product = row?.product;
  if (!membership || !product || product.status !== "ACTIVE") return null;

  const availabilityRules = Array.isArray(product.availabilityRules) ? product.availabilityRules : [];
  if (!catalogProductIsAvailable(availabilityRules, now)) return null;

  const pricingRules = (Array.isArray(product.pricingRules) ? product.pricingRules : []).map((rule: any) => ({
    ...rule,
    startsAt: dateOrNull(rule.startsAt),
    endsAt: dateOrNull(rule.endsAt)
  }));
  const images = Array.isArray(product.images) ? product.images : [];
  const primaryImage = images.find((image: any) => image.isPrimary && image.publicUrl)?.publicUrl
    ?? images.find((image: any) => image.publicUrl)?.publicUrl;
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
    visual: publicImage(membership.presentationImage) ?? primaryImage ?? product.slug,
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
  const now = new Date();
  const products = contract.products
    .map((row: any) => mapRevisionProduct(row, revision.id, sectionById, now))
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
      },
      include: {
        activeRevision: true,
        publications: {
          where: { status: "PUBLISHED" },
          orderBy: { publishedAt: "desc" },
          take: 1
        }
      }
    });
    return revisionAuthority(collection);
  });
}

async function readLegacyCatalog(): Promise<MenuAuthoritySnapshot> {
  return withPrismaAuthContext(SYSTEM_AUTH_CONTEXT, async (database) => {
    const now = new Date();
    const rows = await database.catalogProduct.findMany({
      where: { brandKey: "SALORA", status: "ACTIVE" },
      include: {
        category: true,
        images: {
          where: { archivedAt: null, deletedAt: null },
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
        },
        variants: { orderBy: { name: "asc" } },
        addons: { orderBy: { name: "asc" } },
        modifiers: { orderBy: { name: "asc" } },
        pricingRules: true,
        availabilityRules: true
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }]
    });

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
        visual: row.images.find((image) => image.publicUrl)?.publicUrl ?? row.slug,
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
    if (error instanceof MenuAuthorityUnavailableError || authorityMode() === "required") throw error;
    return readLegacyCatalog();
  }
}

const cachedAuthority = unstable_cache(
  loadAuthority,
  ["salora-menu-authority-v2"],
  { revalidate: MENU_AUTHORITY_REVALIDATE_SECONDS, tags: [MENU_AUTHORITY_CACHE_TAG] }
);

export async function getMenuAuthoritySnapshot() {
  return cachedAuthority();
}

export function invalidateMenuAuthorityCache() {
  revalidateTag(MENU_AUTHORITY_CACHE_TAG, "max");
}

export function menuAuthorityMode(): AuthorityMode {
  return authorityMode();
}

export type { MenuAuthoritySource };
