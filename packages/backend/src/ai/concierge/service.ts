import type { Product } from "@salora/types";
import { routeAiRequest } from "../gateway/gateway";
import type { AiChannel, AiGatewayRequest } from "../types";
import { buildCustomerPreferenceContext } from "./context-builders/customerPreferenceContext";
import { buildLoyaltyContext } from "./context-builders/loyaltyContext";
import { buildMenuRecommendationContext } from "./context-builders/menuRecommendationContext";
import { buildOrderContext } from "./context-builders/orderContext";
import { buildProductContext } from "./context-builders/productContext";

type ConciergeBase = {
  message: string;
  channel?: AiChannel;
  locale?: string;
  products?: Product[];
  customerPreferences?: Record<string, unknown>;
  loyalty?: { points?: number; tier?: string };
  order?: { items?: Array<{ name: string; quantity: number }>; total?: number };
};

function baseRequest(input: ConciergeBase, intent: AiGatewayRequest["intent"]): AiGatewayRequest {
  const products = input.products ?? [];
  return {
    message: input.message,
    intent,
    channel: input.channel ?? "web",
    locale: input.locale ?? "en",
    context: {
      channel: input.channel ?? "web",
      locale: input.locale ?? "en",
      products: buildProductContext(products),
      customer: buildCustomerPreferenceContext(input.customerPreferences),
      loyalty: buildLoyaltyContext(input.loyalty),
      order: buildOrderContext(input.order)
    }
  };
}

export function askConcierge(input: ConciergeBase) {
  return routeAiRequest(baseRequest(input, "concierge"));
}

export function recommendProducts(input: ConciergeBase) {
  const request = baseRequest(input, "recommend_products");
  const channel = input.channel ?? "web";
  request.context = {
    ...request.context,
    channel,
    products: buildMenuRecommendationContext(input.products ?? [], input.message)
  };
  return routeAiRequest(request);
}

export function suggestPairings(input: ConciergeBase) {
  return routeAiRequest(baseRequest(input, "suggest_pairings"));
}

export function explainProduct(input: ConciergeBase) {
  return routeAiRequest(baseRequest(input, "explain_product"));
}

export function helpWithOrder(input: ConciergeBase) {
  return routeAiRequest(baseRequest(input, "help_with_order"));
}

export function loyaltyAssistant(input: ConciergeBase) {
  return routeAiRequest(baseRequest(input, "loyalty_assistant"));
}
