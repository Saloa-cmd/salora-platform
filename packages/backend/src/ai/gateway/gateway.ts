import { withSpan } from "../../observability/tracing";
import { assertCostAllowed, recordAiCost } from "../cost-control/cost";
import { evaluateAiResponse } from "../evaluation/evaluator";
import { evaluateGroundedResponse } from "../evaluation/v2/evaluator";
import { persistEvaluationMetadata } from "../evaluation/v2/store";
import { assertCostCeiling, assertProviderApproved, assertRateLimit, environmentAllowsProvider } from "../governance/governance";
import { providerFallbackOrder, selectProvider, updateProviderHealth } from "./routing/router";
import {
  recordAiError,
  recordAiEstimatedCost,
  recordAiEvaluation,
  recordAiFallback,
  recordAiLatency,
  recordAiProviderFailure,
  recordAiProviderLatency,
  recordAiProviderUsage,
  recordAiSafetyBlock
} from "../observability/metrics";
import { assertPolicyAllows, getAiPolicy } from "../policies/policy";
import { getAiProvider } from "../providers/registry";
import { inspectAiRequest, safeRefusal, sanitizeAiOutput } from "../safety/safety";
import type { AiGatewayRequest, AiGatewayResponse } from "../types";

export async function routeAiRequest(request: AiGatewayRequest): Promise<AiGatewayResponse> {
  const started = Date.now();
  const policy = getAiPolicy();
  assertPolicyAllows(policy, request.intent, request.channel);
  await assertRateLimit(request.customerId ?? request.channel);

  const safety = inspectAiRequest(request.message);
  const correlationId = crypto.randomUUID();

  if (safety.blocked) {
    recordAiSafetyBlock();
    const provider = getAiProvider("mock").metadata;
    return {
      answer: safeRefusal(safety.reasons),
      provider,
      usage: { inputTokens: Math.ceil(request.message.length / 4), outputTokens: 0, estimatedCost: 0 },
      safety: { blocked: true, reasons: safety.reasons },
      evaluation: { score: 100, notes: ["Blocked before provider call."] },
      correlationId
    };
  }

  return withSpan("ai.gateway", {
    "salora.ai.intent": request.intent,
    "salora.ai.channel": request.channel,
    "salora.ai.provider": policy.defaultProvider
  }, async () => {
    let lastError: unknown;

    const primaryProvider = selectProvider(request);
    const providers = providerFallbackOrder(primaryProvider);

    for (let attempt = 0; attempt <= policy.retryLimit; attempt += 1) {
      const providerName = providers[Math.min(attempt, providers.length - 1)] ?? "mock";
      const provider = getAiProvider(providerName);

      try {
        assertProviderApproved(provider.metadata.provider, provider.metadata.model);
        if (!environmentAllowsProvider(provider.metadata.provider)) {
          throw new Error("AI provider is not allowed in this environment.");
        }
        if (attempt > 0) {
          recordAiFallback();
        }
        const providerStarted = Date.now();
        const result = await provider.chat({ ...request, message: safety.sanitizedMessage }, { timeoutMs: policy.timeoutMs });
        const providerLatency = Date.now() - providerStarted;
        updateProviderHealth(provider.metadata.provider, { latencyMs: providerLatency });
        recordAiProviderLatency(provider.metadata.provider, providerLatency);
        recordAiProviderUsage(provider.metadata.provider);
        assertCostAllowed(result.usage, policy.perRequestCostLimit);
        const answer = sanitizeAiOutput(result.text);
        const legacyEvaluation = evaluateAiResponse(request, answer);
        const groundedEvaluation = evaluateGroundedResponse({ request, answer, provider: result.metadata, usage: result.usage, latencyMs: providerLatency });
        const evaluation = {
          score: Math.min(legacyEvaluation.score, groundedEvaluation.overall),
          notes: [...legacyEvaluation.notes, ...groundedEvaluation.notes]
        };
        persistEvaluationMetadata({
          correlationId,
          provider: result.metadata.provider,
          model: result.metadata.model,
          intent: request.intent,
          channel: request.channel,
          score: groundedEvaluation,
          latencyMs: providerLatency,
          estimatedCost: result.usage.estimatedCost,
          safetyBlocked: false
        });
        assertCostCeiling(result.usage.estimatedCost);
        recordAiCost(request.customerId ?? request.channel, result.usage);
        recordAiEstimatedCost(result.usage.estimatedCost);
        recordAiEvaluation(evaluation.score);
        recordAiLatency(Date.now() - started);
        return {
          answer,
          provider: result.metadata,
          usage: result.usage,
          safety: { blocked: false, reasons: [] },
          evaluation,
          correlationId
        };
      } catch (error) {
        lastError = error;
        updateProviderHealth(provider.metadata.provider, { failed: true });
        recordAiProviderFailure(provider.metadata.provider);
        recordAiError();
      }
    }

    throw lastError instanceof Error ? lastError : new Error("AI gateway failed.");
  });
}
