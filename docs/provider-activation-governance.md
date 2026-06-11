# Provider Activation Governance

Date: 2026-06-01

## Central Activation Matrix

| Provider | Configured | Validated | Activated | Blocked Reason | Rollback |
|---|---|---|---|---|---|
| OpenAI | YES | NO | NO | Connectivity returned provider quota failure; awaiting quota resolution, certification, and executive approval. | Set `AI_ENABLE_REAL_PROVIDERS=false`, set `AI_DEFAULT_PROVIDER=mock`, blacklist `openai`. |
| Gemini | YES | NO | NO | Awaiting connectivity, fallback, quality, cost, latency, and evaluation certification. | Keep mock provider active and do not route traffic to Gemini. |
| WhatsApp | NO | NO | NO | Missing Meta staging credentials and webhook validation. | Keep `WHATSAPP_ENABLED=false`. |
| Stripe | NO | NO | NO | Missing Stripe test keys and webhook secret. | Keep `PAYMENTS_ENABLED=false` and `STRIPE_ENABLED=false`. |
| Firebase | NO | NO | NO | Missing Firebase service account and project configuration. | Keep Firebase integration inactive. |

## Activation Gates

Each provider must pass:

- Secret-safe credential presence check.
- Connectivity smoke test.
- Functional staging validation.
- Observability validation.
- Failure and rollback drill.
- Approval record.
- Production isolation confirmation.

## Current Decision

OpenAI and Gemini are configured but intentionally not activated.
