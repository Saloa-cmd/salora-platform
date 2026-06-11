import { incrementMetric, recordDuration } from "../../runtime/metrics";

export function recordAiLatency(ms: number): void {
  recordDuration("salora_ai_latency_ms", ms);
}

export function recordAiFallback(): void {
  incrementMetric("salora_ai_fallback_total");
}

export function recordAiError(): void {
  incrementMetric("salora_ai_errors_total");
}

export function recordAiSafetyBlock(): void {
  incrementMetric("salora_ai_safety_blocks_total");
}

export function recordAiEvaluation(score: number): void {
  recordDuration("salora_ai_evaluation_score", score);
}

export function recordAiProviderUsage(provider: string): void {
  incrementMetric(`salora_ai_provider_${provider}_usage_total`);
}

export function recordAiProviderFailure(provider: string): void {
  incrementMetric(`salora_ai_provider_${provider}_failures_total`);
}

export function recordAiProviderLatency(provider: string, ms: number): void {
  recordDuration(`salora_ai_provider_${provider}_latency_ms`, ms);
}

export function recordAiEstimatedCost(cost: number): void {
  recordDuration("salora_ai_estimated_cost", cost);
}

export function recordAiKnowledgeUsage(count: number): void {
  recordDuration("salora_ai_knowledge_usage_count", count);
}

export function recordAiRecommendationScore(score: number): void {
  recordDuration("salora_ai_recommendation_score", score);
}
