import type { AiGatewayRequest } from "../../types";
import type { AiProvider } from "../provider";
import { providerResult } from "../provider";

export class GeminiProvider implements AiProvider {
  metadata = {
    provider: "gemini",
    model: "gemini-1.5-flash",
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsEmbeddings: true,
    supportsToolCalling: true
  };

  async chat(request: AiGatewayRequest, options: { timeoutMs: number }) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (process.env.AI_ENABLE_REAL_PROVIDERS !== "true" || !apiKey) {
      throw new Error("Gemini provider is disabled or missing credentials.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.metadata.model}:generateContent?key=${apiKey}`, {
        method: "POST",
        signal: controller.signal,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: request.message }] }] })
      });
      if (!response.ok) throw new Error(`Gemini request failed: ${response.status}`);
      const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      return providerResult(data.candidates?.[0]?.content?.parts?.[0]?.text ?? "", this.metadata, request.message);
    } finally {
      clearTimeout(timeout);
    }
  }
}
