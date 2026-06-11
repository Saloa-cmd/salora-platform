import type { AiGatewayRequest, AiGatewayResponse, AiProviderMetadata, AiUsage } from "../types";

export type AiProviderResult = {
  text: string;
  usage: AiUsage;
  metadata: AiProviderMetadata;
};

export interface AiProvider {
  metadata: AiProviderMetadata;
  chat(request: AiGatewayRequest, options: { timeoutMs: number }): Promise<AiProviderResult>;
}

export function providerResult(text: string, metadata: AiProviderMetadata, input: string): AiProviderResult {
  const inputTokens = Math.ceil(input.length / 4);
  const outputTokens = Math.ceil(text.length / 4);
  return {
    text,
    metadata,
    usage: {
      inputTokens,
      outputTokens,
      estimatedCost: 0
    }
  };
}

export type ProviderResponse = Pick<AiGatewayResponse, "answer" | "provider" | "usage">;
