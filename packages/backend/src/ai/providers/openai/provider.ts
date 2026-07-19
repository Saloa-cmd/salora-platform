import type { AiGatewayRequest } from "../../types";
import type { AiProvider } from "../provider";
import { providerResult } from "../provider";

const SALORA_SYSTEM_PROMPT = `You are SALORA's bilingual AI concierge for a premium cafe in Salalah, Oman.
Answer clearly in the customer's language and preserve SALORA's calm, warm, and professional voice.
Use only information supplied by the platform. Never invent prices, availability, ingredients, allergens, rewards, or order status.
Never change catalog data, prices, availability, loyalty balances, payments, or orders. You may only explain or draft recommendations.
When information is missing or uncertain, say so and direct the customer to SALORA staff or WhatsApp.`;

function positiveNumber(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export class OpenAiProvider implements AiProvider {
  metadata = {
    provider: "openai",
    model: "gpt-4.1-mini",
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsEmbeddings: true,
    supportsToolCalling: true
  };

  async chat(request: AiGatewayRequest, options: { timeoutMs: number }) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (process.env.AI_ENABLE_REAL_PROVIDERS !== "true" || !apiKey) {
      throw new Error("OpenAI provider is disabled or missing credentials.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: this.metadata.model,
          messages: [
            { role: "system", content: SALORA_SYSTEM_PROMPT },
            { role: "user", content: request.message }
          ],
          temperature: 0.3,
          max_completion_tokens: 600
        })
      });
      if (!response.ok) throw new Error(`OpenAI request failed: ${response.status}`);

      const data = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      const text = data.choices?.[0]?.message?.content?.trim() ?? "";
      if (!text) throw new Error("OpenAI returned an empty response.");

      const result = providerResult(text, this.metadata, request.message);
      const inputTokens = data.usage?.prompt_tokens ?? result.usage.inputTokens;
      const outputTokens = data.usage?.completion_tokens ?? result.usage.outputTokens;
      result.usage = {
        inputTokens,
        outputTokens,
        estimatedCost: (
          inputTokens * positiveNumber(process.env.AI_OPENAI_INPUT_USD_PER_MILLION)
          + outputTokens * positiveNumber(process.env.AI_OPENAI_OUTPUT_USD_PER_MILLION)
        ) / 1_000_000
      };
      return result;
    } finally {
      clearTimeout(timeout);
    }
  }
}
