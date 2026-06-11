# SALORA Phase 4.5 AI Runtime Review

Date: 2026-05-31

## Strengths

- AI Gateway already isolates application routes from providers.
- Mock provider enables deterministic CI and local demos.
- Safety, cost control, evaluation, and observability exist as separate modules.
- Business domains provide the raw foundation for products, orders, loyalty, notifications, and future personalization.

## Weaknesses

- Real provider adapters are not yet present.
- Routing is policy-only and not latency/failure/cost aware.
- Evaluation is heuristic v1 and does not score provider performance dimensions independently.
- Recommendations are gateway-driven but not yet knowledge-aware or seasonality/time-aware.
- Knowledge is prompt/context-only; no repository layer exists yet.

## Bottlenecks

- Provider health and latency are not yet tracked per provider.
- Cost efficiency is not evaluated across providers.
- Context builders are split under concierge instead of a reusable AI context engine.

## Scalability Concerns

- Future real providers need explicit approval, model governance, and environment restrictions.
- Recommendation quality will depend on structured knowledge and domain events, not prompts alone.

## Provider Lock-In Risks

Direct SDK usage inside API routes would create lock-in. SALORA avoids that by keeping OpenAI, Gemini, Claude, and mock behind a single provider interface.

## Safety Risks

Prompt injection, secret extraction, and raw customer data leakage remain the main risks. The gateway must continue to sanitize input and output before/after provider execution.

## Cost Risks

Real providers introduce variable costs. Phase 4.5 adds per-provider cost estimates, budget governance, and cost-aware routing hooks.

