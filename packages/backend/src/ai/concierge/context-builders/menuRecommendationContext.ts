import type { Product } from "@salora/types";

export function buildMenuRecommendationContext(products: Product[], mood?: string) {
  const text = mood?.toLowerCase() ?? "";
  return products
    .filter((product) => !text || product.tags.some((tag) => text.includes(tag)) || text.includes(product.category.toLowerCase()))
    .slice(0, 6)
    .map((product) => ({
      id: product.id,
      name: product.name,
      tags: product.tags,
      pairing: product.pairing
    }));
}
