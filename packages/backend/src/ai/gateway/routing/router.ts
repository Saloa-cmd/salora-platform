import { getAiPolicy } from "../../policies/policy";
import type { AiGatewayRequest } from "../../types";

export type ProviderHealth = {
  provider: string;
  healthScore: number;
  latencyMs: number;
  failures: number;
  blacklisted?: boolean;
};

const health = new Map<string, ProviderHealth>([
  ["mock", { provider: "mock", healthScore: 100, latencyMs: 1, failures: 0 }],
  ["openai", { provider: "openai", healthScore: 90, latencyMs: 600, failures: 0 }],
  ["gemini", { provider: "gemini", healthScore: 88, latencyMs: 650, failures: 0 }],
  ["claude", { provider: "claude", healthScore: 88, latencyMs: 700, failures: 0 }]
]);

function providerBlacklist(): Set<string> {
  return new Set((process.env.AI_PROVIDER_BLACKLIST ?? "").split(",").map((provider) => provider.trim()).filter(Boolean));
}

export function updateProviderHealth(provider: string, result: { latencyMs?: number; failed?: boolean }) {
  const current = health.get(provider) ?? { provider, healthScore: 80, latencyMs: 1000, failures: 0 };
  const failures = current.failures + (result.failed ? 1 : 0);
  const latencyMs = result.latencyMs ?? current.latencyMs;
  health.set(provider, {
    ...current,
    failures,
    latencyMs,
    healthScore: Math.max(0, 100 - failures * 10 - Math.floor(latencyMs / 500))
  });
}

export function selectProvider(request: AiGatewayRequest, preferredProvider?: string): string {
  const policy = getAiPolicy();
  const blacklist = providerBlacklist();
  if (preferredProvider && !blacklist.has(preferredProvider)) return preferredProvider;
  if (request.channel === "future_voice") return "mock";

  const candidate = health.get(policy.defaultProvider);
  if (!candidate || candidate.blacklisted || blacklist.has(candidate.provider) || candidate.healthScore < 40) {
    return policy.fallbackProvider;
  }

  return policy.defaultProvider;
}

export function providerFallbackOrder(primary: string): string[] {
  const policy = getAiPolicy();
  const blacklist = providerBlacklist();
  return [...new Set([primary, policy.fallbackProvider, "mock"])].filter((provider) => !blacklist.has(provider) || provider === "mock");
}

export function listProviderHealth() {
  const blacklist = providerBlacklist();
  return [...health.values()].map((provider) => ({ ...provider, blacklisted: provider.blacklisted || blacklist.has(provider.provider) }));
}
