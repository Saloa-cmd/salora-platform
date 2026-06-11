import type { Product } from "@salora/types";
import { recordAiRecommendationScore } from "../observability/metrics";

export type RecommendationInput = {
  products: Product[];
  preferences?: Record<string, unknown>;
  orderHistory?: Array<{ items: string[] }>;
  loyalty?: { tier?: string; points?: number };
  inventory?: Array<{ productId: string; available: boolean }>;
  now?: Date;
};

export function recommendProductsAdvanced(input: RecommendationInput) {
  const hour = (input.now ?? new Date()).getHours();
  const available = new Set(input.inventory?.filter((item) => item.available).map((item) => item.productId) ?? input.products.map((product) => product.id));
  const preferredTaste = String(input.preferences?.taste ?? "").toLowerCase();
  const recentItems = new Set(input.orderHistory?.flatMap((order) => order.items) ?? []);

  const recommendations = input.products
    .filter((product) => available.has(product.id))
    .map((product) => {
      let score = 50;
      if (product.tags.some((tag) => preferredTaste.includes(tag))) score += 20;
      if (hour >= 6 && hour <= 11 && product.category === "Coffee") score += 8;
      if (hour >= 16 && product.category === "Dessert") score += 8;
      if (recentItems.has(product.name)) score += 5;
      if (product.featured) score += 10;
      return { productId: product.id, name: product.name, score, reason: product.pairing ?? "SALORA signature fit" };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  const averageScore = recommendations.length ? recommendations.reduce((total, item) => total + item.score, 0) / recommendations.length : 0;
  recordAiRecommendationScore(averageScore);
  return recommendations;
}

export function recommendPairingsAdvanced(products: Product[]) {
  return products
    .filter((product) => product.pairing)
    .map((product) => ({ productId: product.id, name: product.name, pairing: product.pairing, score: 90 }))
    .slice(0, 5);
}

export function recommendUpsells(products: Product[]) {
  return products.filter((product) => product.category === "Dessert").slice(0, 3).map((product) => ({ productId: product.id, name: product.name, reason: "Dessert upsell" }));
}

export function recommendLoyaltyRewards(loyalty?: { tier?: string; points?: number }) {
  const points = loyalty?.points ?? 0;
  return points >= 500 ? ["Signature drink reward", "Dessert pairing reward"] : ["Earn toward signature drink reward"];
}
