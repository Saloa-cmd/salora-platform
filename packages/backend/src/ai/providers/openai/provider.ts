import type { AiGatewayRequest } from "../../types";
import type { AiProvider } from "../provider";
import { providerResult } from "../provider";

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
          messages: [{ role: "user", content: request.message }],
          temperature: 0.4
        })
      });
      if (!response.ok) throw new Error(`OpenAI request failed: ${response.status}`);
      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      return providerResult(data.choices?.[0]?.message?.content ?? "", this.metadata, request.message);
    } finally {
      clearTimeout(timeout);
    }
  }
}
