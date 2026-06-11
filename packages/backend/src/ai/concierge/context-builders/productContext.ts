import type { Product } from "@salora/types";

export function buildProductContext(products: Product[]) {
  return products.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    description: product.description,
    tags: product.tags,
    pairing: product.pairing,
    price: product.price
  }));
}
