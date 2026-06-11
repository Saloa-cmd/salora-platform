import { z } from "zod";
import type { AiChannel, AiIntent, AiSafetyLevel } from "../types";

const runtimeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

export type AiPolicy = {
  allowedIntents: AiIntent[];
  allowedChannels: AiChannel[];
  defaultProvider: string;
  fallbackProvider: string;
  maxInputTokens: number;
  maxOutputTokens: number;
  timeoutMs: number;
  retryLimit: number;
  safetyLevel: AiSafetyLevel;
  perRequestCostLimit: number;
};

const envSchema = z.object({
  AI_DEFAULT_PROVIDER: z.string().default("mock"),
  AI_ENABLE_REAL_PROVIDERS: z.enum(["true", "false"]).default("false"),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  AI_MAX_RETRIES: z.coerce.number().int().min(0).default(2),
  AI_DAILY_COST_LIMIT: z.coerce.number().nonnegative().optional(),
  AI_SAFETY_LEVEL: z.enum(["standard", "strict"]).default("strict")
});

export function getAiPolicy(): AiPolicy {
  const env = envSchema.parse(runtimeEnv);
  const provider = env.AI_ENABLE_REAL_PROVIDERS === "true" ? env.AI_DEFAULT_PROVIDER : "mock";
  return {
    allowedIntents: ["concierge", "recommend_products", "suggest_pairings", "explain_product", "help_with_order", "loyalty_assistant"],
    allowedChannels: ["web", "mobile", "future_whatsapp", "future_voice"],
    defaultProvider: provider,
    fallbackProvider: "mock",
    maxInputTokens: 1600,
    maxOutputTokens: 600,
    timeoutMs: env.AI_REQUEST_TIMEOUT_MS,
    retryLimit: env.AI_MAX_RETRIES,
    safetyLevel: env.AI_SAFETY_LEVEL,
    perRequestCostLimit: 0.05
  };
}

export function assertPolicyAllows(policy: AiPolicy, intent: AiIntent, channel: AiChannel): void {
  if (!policy.allowedIntents.includes(intent)) {
    throw new Error("AI intent is not allowed.");
  }

  if (!policy.allowedChannels.includes(channel)) {
    throw new Error("AI channel is not allowed.");
  }
}
