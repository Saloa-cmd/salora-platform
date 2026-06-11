import { assertDistributedRateLimit } from "../../cache/rateLimit";

const approvedProviders = new Set(["mock", "openai", "gemini", "claude"]);
const approvedModels = new Set(["salora-deterministic-concierge", "gpt-4.1-mini", "gemini-1.5-flash", "claude-3-5-haiku-latest"]);

export function assertProviderApproved(provider: string, model: string): void {
  if (!approvedProviders.has(provider)) {
    throw new Error("AI provider is not approved.");
  }

  if (!approvedModels.has(model)) {
    throw new Error("AI model is not approved.");
  }
}

export function realProvidersAllowed(): boolean {
  return process.env.AI_ENABLE_REAL_PROVIDERS === "true";
}

export function environmentAllowsProvider(provider: string): boolean {
  if (provider === "mock") return true;
  return realProvidersAllowed() && process.env.NODE_ENV !== "test";
}

export function aiFeatureEnabled(feature: string): boolean {
  return process.env[`AI_FEATURE_${feature.toUpperCase()}`] !== "false";
}

export function assertCostCeiling(estimatedCost: number, ceiling = Number(process.env.AI_DAILY_COST_LIMIT || 0)): void {
  if (ceiling > 0 && estimatedCost > ceiling) {
    throw new Error("AI cost ceiling exceeded.");
  }
}

export async function assertRateLimit(scope: string, limit = Number(process.env.AI_RATE_LIMIT_PER_MINUTE || 60)): Promise<void> {
  await assertDistributedRateLimit(`ai-governance:${scope}`, { limit, windowSeconds: 60 });
}
