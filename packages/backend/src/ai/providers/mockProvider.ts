import type { AiGatewayRequest } from "../types";
import type { AiProvider } from "./provider";
import { providerResult } from "./provider";

export class MockAiProvider implements AiProvider {
  metadata = {
    provider: "mock",
    model: "salora-deterministic-concierge",
    supportsStreaming: false,
    supportsStructuredOutput: true,
    supportsEmbeddings: false,
    supportsToolCalling: false
  };

  async chat(request: AiGatewayRequest) {
    const text = responseForIntent(request);
    return providerResult(text, this.metadata, request.message);
  }
}

function responseForIntent(request: AiGatewayRequest): string {
  switch (request.intent) {
    case "recommend_products":
      return "I recommend starting with a signature matcha or smooth coffee, then choosing a dessert pairing based on sweetness and texture.";
    case "suggest_pairings":
      return "A strong SALORA pairing is a chilled signature drink with a soft dessert, keeping the experience balanced rather than heavy.";
    case "explain_product":
      return "This product should be explained through taste, texture, sweetness, caffeine profile, and the moment it fits best.";
    case "help_with_order":
      return "I can help review the order, confirm quantities, note preferences, and keep the next step clear.";
    case "loyalty_assistant":
      return "Loyalty guidance should focus on available points, progress toward rewards, and tasteful next-best offers.";
    case "concierge":
    default:
      return "Welcome to SALORA. Tell me your mood: cold, sweet, light, bold, or dessert-paired, and I will guide you to a refined choice.";
  }
}
