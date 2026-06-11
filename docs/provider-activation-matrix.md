# Provider Activation Matrix

Date: 2026-06-01

| Provider | Credentials present | Staging activated | Production activated | Rollback available | Monitoring available |
|---|---|---|---|---|---|
| OpenAI | No | No | No | Mock fallback designed | Metrics/evaluation designed |
| Gemini | No | No | No | Mock fallback designed | Metrics/evaluation designed |
| WhatsApp | No | No | No | Disable channel flag designed | Webhook metrics designed |
| Stripe | No | No | No | Mock payment provider designed | Payment metrics designed |

## Activation Rule

No provider may be enabled without approval, credentials, staging health validation, monitoring, and rollback/fallback proof.
