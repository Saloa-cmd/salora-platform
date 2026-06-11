# SALORA AI Runtime Audit

Date: 2026-06-05
Workspace audited: `C:\dev\salora-platform`

## Evidence Base

- AI gateway implementation: `packages/backend/src/ai/gateway/gateway.ts`.
- Provider implementations include mock and OpenAI provider modules.
- Control Tower AI Studio route: `apps/web/app/api/control-tower/ai-studio/route.ts`.
- Simple Launch AI product route: `apps/web/app/api/control-tower/simple-launch/ai-product-tools/route.ts`.
- Product media draft route: `apps/web/app/api/control-tower/media/route.ts`.
- Validation: `pnpm test` passed AI gateway and AI runtime test scripts.

## Runtime Reality

- AI gateway supports policy checks, safety guardrails, rate limiting, provider selection, provider fallback, evaluation metadata, cost metadata, and observability hooks.
- OpenAI provider exists, but real calls depend on `AI_ENABLE_REAL_PROVIDERS === "true"` and `OPENAI_API_KEY`.
- Mock provider exists and can produce deterministic responses.
- AI Studio writes `AiRecommendationRecord` for text/recommendation workflows.
- Product/media AI workflows can write `ProductMediaDraft`.

## Workflow Matrix

| Workflow | Classification | Evidence | Finding |
|---|---:|---|---|
| OpenAI runtime | PARTIAL | OpenAI provider present; env-gated real provider calls. | Code exists; live key and provider call not verified. |
| AI gateway fallback | ACTIVE | Gateway provider fallback and mock provider exist; tests passed. | Runtime can degrade to fallback. |
| AI Studio drafts | ACTIVE | Control Tower AI Studio route writes recommendation records. | DB-backed if live schema has tables. |
| Recommendation records | ACTIVE | `AiRecommendationRecord` model and routes. | Active persistence path. |
| Product media drafts | ACTIVE/PARTIAL | `ProductMediaDraft` model and media routes. | Prompt/draft persistence verified by code; actual image generation not verified. |
| Token/cost tracking | PARTIAL | Gateway has cost/evaluation metadata concepts. | Live billing/token observability not proven. |

## Risks

- Real provider behavior was not live-tested in this audit.
- Mock fallback can hide provider misconfiguration unless runtime health explicitly reports provider mode.
- AI-generated product/media workflows need stronger review/approval states before production automation.

## Recommendation

- Add an AI runtime status endpoint or Control Tower card showing active provider mode, fallback mode, and last provider error.
- Keep mock provider for tests, but surface it clearly in non-test runtime.
- Do not expand AI features until provider observability is production-grade.
