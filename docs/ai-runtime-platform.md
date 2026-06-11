# SALORA AI Runtime Platform

Phase 4.5 upgrades SALORA from AI-ready infrastructure to an enterprise AI runtime. The runtime keeps applications behind the internal AI Gateway and prevents direct access to provider SDKs or raw provider APIs.

## Architecture

- API routes validate input, apply RBAC/session context, and call domain services.
- Concierge and recommendation services build privacy-safe context.
- The AI Gateway applies safety, policy, governance, routing, cost control, and observability.
- Provider adapters normalize OpenAI, Gemini, Claude, and mock responses into one internal result shape.
- Evaluation v2 scores grounded quality without requiring an external AI judge.
- The Knowledge Layer supplies menu, loyalty, policy, FAQ, offer, and business-rule facts for future RAG.

## Production Rules

- Real providers are disabled unless `AI_ENABLE_REAL_PROVIDERS=true`.
- Provider keys are read only from environment variables.
- Mock provider remains the default for CI, local tests, and safe demos.
- WhatsApp, voice, Stripe, and Firebase remain out of scope for this phase.

## Runtime Flow

1. Validate request with Zod.
2. Inspect and sanitize user input.
3. Select an approved provider through routing.
4. Enforce environment, rate, and cost governance.
5. Execute provider request with timeout protection.
6. Sanitize output and evaluate response quality.
7. Record latency, fallback, safety, error, cost, and evaluation metrics.
