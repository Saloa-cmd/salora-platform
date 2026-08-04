export const MENU_REVISION_CONTRACT_VERSION = 2 as const;

type JsonRecord = Record<string, unknown>;

function jsonSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function sortByOrder<T extends { sortOrder?: number; key?: string; slug?: string }>(items: T[]) {
  return [...items].sort((left, right) =>
    (left.sortOrder ?? 0) - (right.sortOrder ?? 0)
      || String(left.key ?? left.slug ?? "").localeCompare(String(right.key ?? right.slug ?? ""))
  );
}

export function buildMenuRevisionSnapshot(collection: any) {
  const sections = sortByOrder(collection.sections ?? []).map((section: any) => ({
    id: section.id,
    key: section.key,
    nameAr: section.nameAr,
    nameEn: section.nameEn,
    descriptionAr: section.descriptionAr,
    descriptionEn: section.descriptionEn,
    sortOrder: section.sortOrder,
    membershipRule: section.membershipRule,
    isActive: section.isActive
  }));

  const sectionOrder = new Map(sections.map((section) => [section.id, section.sortOrder]));

  const products = [...(collection.products ?? [])]
    .sort((left: any, right: any) =>
      (sectionOrder.get(left.sectionId) ?? Number.MAX_SAFE_INTEGER)
        - (sectionOrder.get(right.sectionId) ?? Number.MAX_SAFE_INTEGER)
      || (left.sortOrder ?? 0) - (right.sortOrder ?? 0)
      || String(left.product?.slug ?? "").localeCompare(String(right.product?.slug ?? ""))
    )
    .map((membership: any) => ({
      membership: {
        id: membership.id,
        sectionId: membership.sectionId,
        sortOrder: membership.sortOrder,
        titleArOverride: membership.titleArOverride,
        titleEnOverride: membership.titleEnOverride,
        descriptionArOverride: membership.descriptionArOverride,
        descriptionEnOverride: membership.descriptionEnOverride,
        presentationImage: membership.presentationImage,
        badges: membership.badges ?? [],
        membershipSource: membership.membershipSource,
        membershipRuleKey: membership.membershipRuleKey,
        sourceReason: membership.sourceReason,
        isFeatured: membership.isFeatured
      },
      product: {
        id: membership.product.id,
        slug: membership.product.slug,
        name: membership.product.name,
        nameAr: membership.product.nameAr,
        nameEn: membership.product.nameEn,
        description: membership.product.description,
        descriptionAr: membership.product.descriptionAr,
        descriptionEn: membership.product.descriptionEn,
        status: membership.product.status,
        basePrice: membership.product.basePrice,
        tags: membership.product.tags ?? [],
        pairingHint: membership.product.pairingHint,
        aiDescriptor: membership.product.aiDescriptor,
        category: membership.product.category
          ? {
              id: membership.product.category.id,
              slug: membership.product.category.slug,
              name: membership.product.category.name,
              nameAr: membership.product.category.nameAr,
              nameEn: membership.product.category.nameEn,
              sortOrder: membership.product.category.sortOrder
            }
          : null,
        images: membership.product.images ?? [],
        variants: membership.product.variants ?? [],
        addons: membership.product.addons ?? [],
        modifiers: membership.product.modifiers ?? [],
        pricingRules: membership.product.pricingRules ?? [],
        availabilityRules: membership.product.availabilityRules ?? [],
        nutritionProfile: membership.product.nutritionProfile ?? null,
        allergenProfile: membership.product.allergenProfile ?? null
      }
    }));

  return jsonSafe({
    contractVersion: MENU_REVISION_CONTRACT_VERSION,
    generatedAt: new Date().toISOString(),
    collection: {
      id: collection.id,
      brandKey: collection.brandKey,
      key: collection.key,
      slug: collection.slug,
      kind: collection.kind,
      status: collection.status,
      nameAr: collection.nameAr,
      nameEn: collection.nameEn,
      descriptionAr: collection.descriptionAr,
      descriptionEn: collection.descriptionEn,
      accentTokens: collection.accentTokens,
      coverMedia: collection.coverMedia,
      banner: collection.banner,
      channels: collection.channels,
      completenessScore: collection.completenessScore
    },
    sections,
    products
  });
}

export function isMenuRevisionContractV2(value: unknown): value is JsonRecord & {
  contractVersion: 2;
  collection: JsonRecord;
  sections: unknown[];
  products: unknown[];
} {
  if (!value || typeof value !== "object") return false;
  const record = value as JsonRecord;
  return record.contractVersion === MENU_REVISION_CONTRACT_VERSION
    && Boolean(record.collection && typeof record.collection === "object")
    && Array.isArray(record.sections)
    && Array.isArray(record.products);
}
