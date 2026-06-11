export const aiIntents = [
  "concierge",
  "recommend_products",
  "suggest_pairings",
  "explain_product",
  "help_with_order",
  "loyalty_assistant"
] as const;

export const aiChannels = ["web", "mobile", "future_whatsapp", "future_voice"] as const;

export type AiIntent = (typeof aiIntents)[number];
export type AiChannel = (typeof aiChannels)[number];
export type AiSafetyLevel = "standard" | "strict";

export type AiDomainContext = {
  customer?: Record<string, unknown>;
  products?: Array<Record<string, unknown>>;
  order?: Record<string, unknown>;
  loyalty?: Record<string, unknown>;
  locale?: string;
  channel: AiChannel;
};

export type AiGatewayRequest = {
  message: string;
  intent: AiIntent;
  channel: AiChannel;
  locale?: string;
  customerId?: string;
  context?: AiDomainContext;
};

export type AiUsage = {
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
};

export type AiProviderMetadata = {
  provider: string;
  model: string;
  supportsStreaming: boolean;
  supportsStructuredOutput: boolean;
  supportsEmbeddings: boolean;
  supportsToolCalling: boolean;
};

export type AiGatewayResponse = {
  answer: string;
  provider: AiProviderMetadata;
  usage: AiUsage;
  safety: {
    blocked: boolean;
    reasons: string[];
  };
  evaluation: {
    score: number;
    notes: string[];
  };
  correlationId: string;
};
