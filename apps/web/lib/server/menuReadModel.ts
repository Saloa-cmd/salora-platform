import type { MenuAuthoritySection, MenuAuthoritySnapshot, MenuProductSummary, Product } from "@salora/types";
import { inspectMenuAuthoritySnapshot } from "./menuAuthorityContract.ts";

export const MENU_RESULT_PAGE_SIZE = 24;
export const MENU_RESULT_MAX_LIMIT = 96;
export const MENU_SEARCH_MAX_LENGTH = 80;

export type MenuCategorySummary = MenuAuthoritySection & {
  productCount: number;
};

export type MenuReadModel = {
  categories: MenuCategorySummary[];
  selectedCategory: string;
  products: MenuProductSummary[];
  resultTotal: number;
  resultLimit: number;
  hasMore: boolean;
  query: string;
  searchAvailable: boolean;
  totalCatalogProducts: number;
};

export type MenuReadInput = {
  category?: string | null;
  query?: string | null;
  limit?: string | number | null;
};

export class MenuReadContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MenuReadContractError";
  }
}

export function normalizeMenuSearch(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/gu, "")
    .replace(/ـ/gu, "")
    .replace(/[إأآٱ]/gu, "ا")
    .replace(/ى/gu, "ي")
    .replace(/ؤ/gu, "و")
    .replace(/ئ/gu, "ي")
    .toLocaleLowerCase("ar")
    .replace(/\s+/gu, " ")
    .trim();
}

function requestedLimit(value: MenuReadInput["limit"]): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < MENU_RESULT_PAGE_SIZE) return MENU_RESULT_PAGE_SIZE;
  return Math.min(parsed, MENU_RESULT_MAX_LIMIT);
}

function searchableProduct(product: Product): string {
  return normalizeMenuSearch([
    product.name,
    product.nameAr,
    product.nameEn,
    product.description,
    product.descriptionAr,
    product.descriptionEn,
    product.category,
    product.categoryAr,
    product.categoryEn,
    ...product.tags,
    ...(product.badges ?? [])
  ].filter(Boolean).join(" "));
}

function projectProductSummary(product: Product): MenuProductSummary {
  return {
    id: product.id,
    catalogId: product.catalogId,
    menuRevisionId: product.menuRevisionId,
    sectionKey: product.sectionKey,
    name: product.name,
    nameAr: product.nameAr,
    nameEn: product.nameEn,
    category: product.category,
    categoryAr: product.categoryAr,
    categoryEn: product.categoryEn,
    description: product.description,
    descriptionAr: product.descriptionAr,
    descriptionEn: product.descriptionEn,
    price: product.price,
    tags: product.tags,
    visual: product.visual,
    featured: product.featured,
    badges: product.badges,
    variants: product.variants,
    addons: product.addons,
    modifierGroups: product.modifierGroups
  };
}

function assertProjectionIntegrity(snapshot: MenuAuthoritySnapshot, categories: MenuCategorySummary[]): void {
  const productIds = new Set<string>();
  const categoryKeys = new Set(categories.map((category) => category.key));

  for (const product of snapshot.products) {
    if (productIds.has(product.id)) {
      throw new MenuReadContractError(`Menu projection contains duplicate product ${product.id}.`);
    }
    productIds.add(product.id);

    if (!product.sectionKey || !categoryKeys.has(product.sectionKey)) {
      throw new MenuReadContractError(`Product ${product.id} is not assigned to an active published section.`);
    }
    if (!Number.isFinite(product.price) || product.price <= 0) {
      throw new MenuReadContractError(`Product ${product.id} has an invalid published price.`);
    }
    if (!product.visual.trim()) {
      throw new MenuReadContractError(`Product ${product.id} has no authoritative visual mapping.`);
    }
  }

  const categoryProductCount = categories.reduce((total, category) => total + category.productCount, 0);
  if (categoryProductCount !== snapshot.products.length) {
    throw new MenuReadContractError(
      `Menu category projection mismatch: expected ${snapshot.products.length}, received ${categoryProductCount}.`
    );
  }
}

export function buildMenuReadModel(snapshot: MenuAuthoritySnapshot, input: MenuReadInput = {}): MenuReadModel {
  const certification = inspectMenuAuthoritySnapshot(snapshot);
  const productCountBySection = snapshot.products.reduce<Map<string, number>>((counts, product) => {
    if (!product.sectionKey) return counts;
    counts.set(product.sectionKey, (counts.get(product.sectionKey) ?? 0) + 1);
    return counts;
  }, new Map());
  const categories = snapshot.sections
    .map<MenuCategorySummary>((section) => ({
      ...section,
      productCount: productCountBySection.get(section.key) ?? 0
    }))
    .filter((section) => section.productCount > 0)
    .sort((left, right) => left.sortOrder - right.sortOrder);

  assertProjectionIntegrity(snapshot, categories);

  const requestedCategory = input.category?.trim() ?? "";
  const selectedCategory = categories.some((category) => category.key === requestedCategory)
    ? requestedCategory
    : categories[0]?.key ?? "";
  const query = (input.query?.trim() ?? "").slice(0, MENU_SEARCH_MAX_LENGTH);
  const normalizedQuery = normalizeMenuSearch(query);
  const resultLimit = requestedLimit(input.limit);
  const searchAvailable = certification === "AUTHORITATIVE";

  const matchingProducts = normalizedQuery
    ? searchAvailable
      ? snapshot.products.filter((product) => searchableProduct(product).includes(normalizedQuery))
      : []
    : snapshot.products.filter((product) => product.sectionKey === selectedCategory);
  const products = matchingProducts.slice(0, resultLimit).map(projectProductSummary);

  return {
    categories,
    selectedCategory,
    products,
    resultTotal: matchingProducts.length,
    resultLimit,
    hasMore: products.length < matchingProducts.length,
    query,
    searchAvailable,
    totalCatalogProducts: snapshot.products.length
  };
}
