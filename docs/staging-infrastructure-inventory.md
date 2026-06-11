# Staging Infrastructure Inventory

Date: 2026-06-01

| Service | Owner | Status | Credentials | Endpoint | Health | Activation readiness |
|---|---|---|---|---|---|---|
| PostgreSQL | Platform/SRE | READY | Local untracked credentials configured | Supabase staging | Migration and table certification passed | Backup/restore live drill pending. |
| Redis | Platform/SRE | READY | Local untracked credentials configured | Upstash staging | Smoke, BullMQ, retry, DLQ, worker recovery passed | Queue pressure load test pending. |
| OpenAI | AI Platform | BLOCKED | Missing `OPENAI_API_KEY` | Provider endpoint coded | Not tested | Requires approval, feature flag, cost/latency monitoring. |
| Gemini | AI Platform | BLOCKED | Missing `GEMINI_API_KEY` | Provider endpoint coded | Not tested | Requires approval, fallback, quality/cost validation. |
| WhatsApp | Omnichannel | BLOCKED | Missing Meta staging secrets | Not configured | Not tested | Webhook verification/signature/inbound/outbound pending. |
| Stripe | Revenue Platform | BLOCKED | Missing test keys/webhook secret | Not configured | Not tested | Payment intent, confirmation, refund, webhook pending. |
| Sentry | SRE | PENDING | Missing `SENTRY_DSN` | Not configured | Not tested | Error monitoring pending. |
| OpenTelemetry | SRE | PENDING | Optional headers missing | Default local OTLP endpoint | Not tested | Collector/export validation pending. |

No secrets are stored in this document.
