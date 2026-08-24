import type { MenuAuthoritySnapshot, Product } from "@salora/types";
import { getMenuAuthoritySnapshot } from "./menuAuthority";

export type PublicMenuSnapshot = MenuAuthoritySnapshot;
export type PublicMenuSource = MenuAuthoritySnapshot["source"];

const safeCollection = {
  id: "catalog-unavailable",
  key: "catalog-unavailable",
  slug: "catalog-unavailable",
  kind: "STANDARD",
  nameAr: "منيو سالورا",
  nameEn: "SALORA Menu"
} as const;

function unavailableMenuSnapshot(): PublicMenuSnapshot {
  return {
    collection: safeCollection,
    revision: null,
    sections: [],
    products: [],
    source: "legacy-catalog",
    stale: true,
    runtimeMode: "offline-cache",
    databaseHealth: "unavailable",
    generatedAt: new Date().toISOString()
  };
}

function isSyntheticTestProduct(product: Product) {
  const identity = [product.id, product.catalogId, product.name, product.nameAr, product.nameEn, product.category, product.categoryAr, product.categoryEn]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();
  const taggedForTest = product.tags.some((tag) => /^(pos[_-]?test|test[_-]?only|synthetic)$/i.test(tag.trim()));
  return taggedForTest || identity.includes("pos test") || identity.includes("pos-test") || identity.includes("synthetic non-production");
}

function quarantineSyntheticTestData(snapshot: PublicMenuSnapshot): PublicMenuSnapshot {
  const products = snapshot.products.filter((product) => !isSyntheticTestProduct(product));
  if (products.length === snapshot.products.length) return snapshot;

  const sectionKeys = new Set(products.map((product) => product.sectionKey).filter((key): key is string => Boolean(key)));
  const sections = snapshot.sections.filter((section) => sectionKeys.has(section.key));

  if (products.length === 0) {
    return {
      ...snapshot,
      collection: safeCollection,
      revision: null,
      sections: [],
      products: [],
      stale: true,
      runtimeMode: "offline-cache"
    };
  }

  return {
    ...snapshot,
    sections,
    products,
    stale: true,
    runtimeMode: "compatibility"
  };
}

export async function getPublicMenuSnapshot(): Promise<PublicMenuSnapshot> {
  if (!process.env.DATABASE_URL) return unavailableMenuSnapshot();

  try {
    return quarantineSyntheticTestData(await getMenuAuthoritySnapshot());
  } catch {
    // Public surfaces remain useful when Preview-only infrastructure is not
    // attached. No products, prices, availability, or test data are fabricated here.
    return unavailableMenuSnapshot();
  }
}

export async function getPublicMenuProducts(): Promise<Product[]> {
  return (await getPublicMenuSnapshot()).products;
}
