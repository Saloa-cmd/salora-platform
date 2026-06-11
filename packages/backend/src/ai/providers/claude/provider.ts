import type { AiGatewayRequest } from "../../types";
import type { AiProvider } from "../provider";
import { providerResult } from "../provider";

export class ClaudeProvider implements AiProvider {
  metadata = {
    provider: "claude",
    model: "claude-3-5-haiku-latest",
    supportsStreaming: true,
    supportsStructuredOutput: false,
    supportsEmbeddings: false,
    supportsToolCalling: true
  };

  async chat(request: AiGatewayRequest, options: { timeoutMs: number }) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (process.env.AI_ENABLE_REAL_PROVIDERS !== "true" || !apiKey) {
      throw new Error("Claude provider is disabled or missing credentials.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: this.metadata.model,
          max_tokens: 600,
          messages: [{ role: "user", content: request.message }]
        })
      });
      if (!response.ok) throw new Error(`Claude request failed: ${response.status}`);
      const data = await response.json() as { content?: Array<{ text?: string }> };
      return providerResult(data.content?.[0]?.text ?? "", this.metadata, request.message);
    } finally {
      clearTimeout(timeout);
    }
  }
}
