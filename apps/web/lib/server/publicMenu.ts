import { products as fallbackProducts } from "@salora/data";
import type { Product } from "@salora/types";
import { SYSTEM_AUTH_CONTEXT, withPrismaAuthContext } from "@salora/backend";

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
};

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
    visual: primaryImage ?? product.slug
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
        }
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
