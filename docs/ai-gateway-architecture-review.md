# SALORA Phase 4 AI Gateway Architecture Review

Date: 2026-05-31

## Executive AI Analysis

SALORA now has the business domains needed for AI readiness: customers, products, orders, inventory, loyalty, notifications, auth/RBAC, observability, and queues. The AI layer must not be a random chatbot. It must be a governed internal gateway that converts safe domain summaries into concierge-grade responses while controlling safety, cost, provider selection, and observability.

## Architecture Options

Option A: Direct provider calls from API routes.

- Rejected. It leaks provider details into application code and makes safety/cost controls inconsistent.

Option B: Single provider SDK wrapper.

- Rejected for now. It creates vendor lock-in and does not prepare for Gemini, Claude, OpenAI, or local models.

Option C: Provider-agnostic AI gateway.

- Selected. API routes call SALORA concierge services, services call the gateway, the gateway applies policies/safety/cost/evaluation, and providers remain behind one typed interface.

## Provider Abstraction Strategy

All providers implement one `AiProvider` interface with chat, structured output readiness, streaming readiness, embeddings readiness, tool-calling readiness, timeout/retry metadata, model metadata, and token/cost reporting. Real providers are disabled by default. The mock provider is deterministic and safe for CI, tests, and local demos.

## Routing Strategy

Routing is policy-driven by intent, channel, safety level, environment, and future role restrictions. Current default route is `mock`. Future providers can be enabled through env and policy without changing API routes.

## Fallback Strategy

The gateway retries within policy limits, then falls back to the configured fallback provider. If safety blocks the request, it returns a safe refusal instead of calling a provider.

## Evaluation Strategy

Responses are evaluated for relevance, safety, hallucination risk, domain correctness, tone consistency, product accuracy, order safety, and recommendation quality. Without real eval providers, SALORA uses deterministic heuristic scoring.

## Cost-Control Strategy

The gateway estimates tokens and cost per request, tracks provider/model/channel/customer usage, and blocks requests that exceed per-request or daily budgets. No billing API is required.

## Safety Strategy

Safety runs before and after provider execution:

- prompt injection checks
- PII minimization
- secret redaction
- unsafe request classification
- safe refusal
- output sanitization
- system prompt leakage prevention

The AI must never expose tokens, secrets, internal prompts, private infrastructure, or raw customer sensitive data.

## Observability Strategy

Metrics include request count, provider used, latency, fallback count, error count, safety block count, evaluation score, estimated cost, and correlation ID. The gateway uses the existing SALORA metrics and OpenTelemetry span wrappers.

## Domain Integration Strategy

AI receives safe summaries only:

- Product context: names, categories, tags, descriptions, pairings.
- Customer preference context: taste preferences and favorites, not raw private data.
- Loyalty context: tier and points summary.
- Order context: current cart/order item summaries.
- Menu recommendation context: candidate products and pairing hints.

No raw database records are exposed to providers.

