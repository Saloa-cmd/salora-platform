import type { AiUsage } from "../types";
import { incrementMetric, recordDuration } from "../../runtime/metrics";

const requestCosts = new Map<string, number>();

export function estimateUsage(input: string, output: string, provider = "mock"): AiUsage {
  const inputTokens = Math.ceil(input.length / 4);
  const outputTokens = Math.ceil(output.length / 4);
  const estimatedCost = provider === "mock" ? 0 : (inputTokens * 0.000001 + outputTokens * 0.000002);
  return { inputTokens, outputTokens, estimatedCost };
}

export function recordAiCost(key: string, usage: AiUsage): void {
  requestCosts.set(key, (requestCosts.get(key) ?? 0) + usage.estimatedCost);
  incrementMetric("salora_ai_requests_total");
  recordDuration("salora_ai_estimated_cost_micro_omr", usage.estimatedCost * 1_000_000);
}

export function assertCostAllowed(usage: AiUsage, perRequestLimit: number): void {
  if (usage.estimatedCost > perRequestLimit) {
    throw new Error("AI request cost exceeds policy.");
  }
}
