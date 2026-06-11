# Go-Live Readiness Review

SALORA is ready for production launch preparation, not additional feature development. This review covers OpenAI, Gemini, and WhatsApp Cloud activation readiness.

## OpenAI Readiness

- Adapter exists behind the AI Gateway.
- Real providers remain disabled by default.
- Activation requires `OPENAI_API_KEY`, `AI_ENABLE_REAL_PROVIDERS=true`, staging-only rollout, and mock fallback.
- Monitoring must track provider latency, failures, fallbacks, estimated cost, safety blocks, and evaluation score.

## Gemini Readiness

- Adapter exists behind the AI Gateway.
- Activation requires `GEMINI_API_KEY`, staging-only rollout, and fallback to mock.
- Gemini should be compared against OpenAI using accuracy, recommendation quality, safety, latency, and cost efficiency.

## WhatsApp Cloud Readiness

- Webhook route exists at `/api/channels/whatsapp/webhook`.
- Verification and signature validation are implemented.
- Provider message idempotency is implemented through `ProviderMessage`.
- Conversation persistence is modeled and migration-ready.
- Activation requires Meta app credentials, webhook secret, phone number id, access token, and staging webhook subscription.

## Go-Live Risks

- Secrets misconfiguration can break activation.
- WhatsApp webhook retries can create duplicate executions if migration is not applied.
- Real AI providers can introduce cost spikes without staging budget controls.
- Database and Redis outages must have incident paths before launch.

## Launch Decision

Proceed to staging activation only after migrations, secrets, dashboards, alerts, backups, and rollback controls are verified.
