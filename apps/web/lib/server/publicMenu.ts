import type { MenuAuthoritySnapshot, Product } from "@salora/types";
import { getMenuAuthoritySnapshot } from "./menuAuthority";

export type PublicMenuSnapshot = MenuAuthoritySnapshot;
export type PublicMenuSource = MenuAuthoritySnapshot["source"];

function unavailableMenuSnapshot(): PublicMenuSnapshot {
  return {
    collection: {
      id: "catalog-unavailable",
      key: "catalog-unavailable",
      slug: "catalog-unavailable",
      kind: "STANDARD",
      nameAr: "منيو سالورا",
      nameEn: "SALORA Menu"
    },
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

export async function getPublicMenuSnapshot(): Promise<PublicMenuSnapshot> {
  if (!process.env.DATABASE_URL) return unavailableMenuSnapshot();

  try {
    return await getMenuAuthoritySnapshot();
  } catch {
    // Public surfaces remain useful when Preview-only infrastructure is not
    // attached. No products, prices, or availability are fabricated here.
    return unavailableMenuSnapshot();
  }
}

export async function getPublicMenuProducts(): Promise<Product[]> {
  return (await getPublicMenuSnapshot()).products;
}
