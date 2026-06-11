import type { Product } from "@salora/types";
import { searchKnowledge } from "../knowledge/repository";
import { recordAiKnowledgeUsage } from "../observability/metrics";

export function buildAiRuntimeContext(input: {
  message: string;
  products?: Product[];
  customerPreferences?: Record<string, unknown>;
  loyalty?: { points?: number; tier?: string };
  orderHistory?: Array<{ total: number; items: string[]; createdAt?: string }>;
  inventory?: Array<{ productId: string; available: boolean }>;
}) {
  const knowledge = searchKnowledge(input.message);
  recordAiKnowledgeUsage(knowledge.length);

  return {
    knowledge,
    menu: (input.products ?? []).slice(0, 8).map((product) => ({
      id: product.id,
      name: product.name,
      tags: product.tags,
      category: product.category,
      pairing: product.pairing
    })),
    customer: {
      taste: input.customerPreferences?.taste ?? "unknown",
      sweetness: input.customerPreferences?.sweetness ?? "unknown"
    },
    loyalty: {
      tier: input.loyalty?.tier ?? "CLASSIC",
      pointsBand: input.loyalty?.points ? Math.floor(input.loyalty.points / 100) * 100 : 0
    },
    orderHistorySummary: {
      count: input.orderHistory?.length ?? 0,
      recentItems: input.orderHistory?.flatMap((order) => order.items).slice(0, 8) ?? []
    },
    inventory: input.inventory?.filter((item) => item.available).map((item) => item.productId) ?? []
  };
}
