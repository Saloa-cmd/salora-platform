# Production Activation Review

Phase 5.5 removes the remaining runtime blockers without adding customer-facing features.

## Current Blockers

- Conversation history needed database persistence for auditability, retention, analytics, and incident review.
- WhatsApp webhook execution needed provider-message idempotency before real retries.
- AI evaluation metadata needed durable storage without persisting sensitive prompts.
- Real AI provider activation needed staging-only playbooks and rollout controls.
- Observability needed explicit dashboard and alert expectations for channels, AI, and webhooks.

## Persistence Gaps Closed

- `Conversation`, `ConversationMessage`, `ChannelSession`, `ProviderMessage`, and `AiEvaluationRecord` are now modeled in Prisma.
- Runtime services attempt Prisma persistence when `DATABASE_URL` exists and safely fall back for CI/local validation.
- Provider message ids are uniquely tracked by provider and provider message id.

## Runtime Risks

- Live WhatsApp retries require the new persistence migration to be applied before enabling the webhook.
- Real providers must not be enabled in production before staging burn-in.
- Conversation retention requires a business policy before long-lived production storage.

## Deployment Risks

- Missing secrets should block staging activation.
- Rollback must include disabling `WHATSAPP_ENABLED` and `AI_ENABLE_REAL_PROVIDERS`.
- Database migration must be applied before webhook subscription is pointed at SALORA.

## Observability Gaps Closed

- Channel metrics exist for inbound, outbound, delivery, failures, webhook failures, and latency.
- AI metrics exist for provider usage, latency, failures, cost, evaluation, knowledge usage, and recommendation score.
- Correlation ids are preserved through AI Gateway responses and conversation message metadata.
