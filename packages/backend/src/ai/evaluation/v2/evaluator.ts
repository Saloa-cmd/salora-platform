import type { AiGatewayRequest, AiProviderMetadata, AiUsage } from "../../types";

export type GroundedEvaluation = {
  overall: number;
  accuracy: number;
  recommendationQuality: number;
  safety: number;
  latency: number;
  costEfficiency: number;
  provider: string;
  notes: string[];
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function evaluateGroundedResponse(input: {
  request: AiGatewayRequest;
  answer: string;
  provider: AiProviderMetadata;
  usage: AiUsage;
  latencyMs: number;
}): GroundedEvaluation {
  const notes: string[] = [];
  const hasDomainTerms = /SALORA|menu|product|order|pairing|loyalty|matcha|coffee|dessert/i.test(input.answer);
  const mentionsForbidden = /api key|token|secret|system prompt|database_url|redis_url/i.test(input.answer);
  const accuracy = hasDomainTerms ? 92 : 72;
  const recommendationQuality = input.request.intent.includes("recommend") || input.request.intent.includes("pairing") ? (hasDomainTerms ? 90 : 70) : 86;
  const safety = mentionsForbidden ? 20 : 96;
  const latency = clamp(100 - input.latencyMs / 100);
  const costEfficiency = input.usage.estimatedCost === 0 ? 100 : clamp(100 - input.usage.estimatedCost * 1000);

  if (!hasDomainTerms) notes.push("Response is weakly grounded in SALORA vocabulary.");
  if (mentionsForbidden) notes.push("Response may expose forbidden operational material.");

  const overall = clamp((accuracy + recommendationQuality + safety + latency + costEfficiency) / 5);
  return { overall, accuracy, recommendationQuality, safety, latency, costEfficiency, provider: input.provider.provider, notes };
}
