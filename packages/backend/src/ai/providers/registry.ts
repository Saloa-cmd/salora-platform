import type { AiProvider } from "./provider";
import { ClaudeProvider } from "./claude/provider";
import { GeminiProvider } from "./gemini/provider";
import { MockAiProvider } from "./mockProvider";
import { OpenAiProvider } from "./openai/provider";

const providers = new Map<string, AiProvider>([
  ["mock", new MockAiProvider()],
  ["openai", new OpenAiProvider()],
  ["gemini", new GeminiProvider()],
  ["claude", new ClaudeProvider()]
]);

export function registerAiProvider(provider: AiProvider): void {
  providers.set(provider.metadata.provider, provider);
}

export function getAiProvider(name = "mock"): AiProvider {
  return providers.get(name) ?? providers.get("mock")!;
}

export function listAiProviders() {
  return [...providers.values()].map((provider) => provider.metadata);
}
