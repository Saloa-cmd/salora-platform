import { products as fallbackProducts } from "@salora/data";
import type { Product, ProductChoice } from "@salora/types";
import { SYSTEM_AUTH_CONTEXT, withPrismaAuthContext } from "@salora/backend/database/rls-context";

export type PublicMenuSource = "database" | "fallback";

export type PublicMenuSnapshot = {
  products: Product[];
  source: PublicMenuSource;
  stale: boolean;
  runtimeMode: "live" | "fallback";
  databaseHealth: "available" | "unavailable";
};

type PublicCatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  basePrice: { toString(): string } | number | string;
  tags: string[];
  pairingHint: string | null;
  category: { name: string } | null;
  images: Array<{ publicUrl: string | null; storagePath: string }>;
  variants: Array<{ id: string; name: string; priceDelta: { toString(): string } | number | string; sku: string | null }>;
  addons: Array<{ id: string; name: string; price: { toString(): string } | number | string }>;
  modifiers: Array<{ id: string; name: string; options: unknown; required: boolean }>;
};

function normalizeOptions(value: unknown): ProductChoice[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((option, index) => {
    if (typeof option === "string") return [{ id: `option-${index}`, name: option, priceDelta: 0 }];
    if (!option || typeof option !== "object") return [];
    const record = option as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name : typeof record.label === "string" ? record.label : "";
    if (!name) return [];
    return [{
      id: typeof record.id === "string" ? record.id : `option-${index}`,
      name,
      priceDelta: Number(record.priceDelta ?? record.price ?? 0) || 0
    }];
  });
}

function mapCatalogProduct(product: PublicCatalogProduct): Product {
  const primaryImage = product.images.find((image) => image.publicUrl)?.publicUrl;

  return {
    id: product.slug,
    name: product.name,
    category: product.category?.name ?? "Menu",
    description: product.description,
    story: product.description,
    price: Number(product.basePrice.toString()),
    tags: product.tags,
    pairing: product.pairingHint ?? undefined,
    visual: primaryImage ?? product.slug,
    variants: product.variants.map((variant) => ({ id: variant.id, name: variant.name, priceDelta: Number(variant.priceDelta.toString()), sku: variant.sku ?? undefined })),
    addons: product.addons.map((addon) => ({ id: addon.id, name: addon.name, priceDelta: Number(addon.price.toString()) })),
    modifierGroups: product.modifiers.map((modifier) => ({ id: modifier.id, name: modifier.name, required: modifier.required, options: normalizeOptions(modifier.options) })).filter((group) => group.options.length > 0)
  };
}

export async function getPublicMenuSnapshot(): Promise<PublicMenuSnapshot> {
  try {
    const products = await withPrismaAuthContext(SYSTEM_AUTH_CONTEXT, (db) => db.catalogProduct.findMany({
      where: { status: "ACTIVE" },
      include: {
        category: true,
        images: {
          where: { archivedAt: null, deletedAt: null },
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
        },
        variants: { orderBy: { name: "asc" } },
        addons: { orderBy: { name: "asc" } },
        modifiers: { orderBy: { name: "asc" } }
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }]
    }));

    return {
      products: products.map(mapCatalogProduct),
      source: "database",
      stale: false,
      runtimeMode: "live",
      databaseHealth: "available"
    };
  } catch {
    return {
      products: fallbackProducts,
      source: "fallback",
      stale: true,
      runtimeMode: "fallback",
      databaseHealth: "unavailable"
    };
  }
}

export async function getPublicMenuProducts(): Promise<Product[]> {
  return (await getPublicMenuSnapshot()).products;
}
