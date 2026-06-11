# Control Tower Provider Certification

Date: 2026-06-01

## Classification

Result: `PARTIAL`

## Provider Certification Center

The Control Tower now exposes a provider certification center with no secrets displayed.

| Provider | Status | Health | Risk | Readiness Score | Activation |
|---|---|---|---|---:|---|
| PostgreSQL | CERTIFIED | Supabase staging active | Medium | 9.8 | ACTIVE |
| Redis | CERTIFIED | Upstash/BullMQ active | Medium | 9.9 | ACTIVE |
| OpenAI | PARTIAL | Direct API audit passed; live gateway route pending | Medium | 8.8 | NOT_ACTIVATED |
| Gemini | PARTIAL | Model listing passed; completion endpoint `NOT_FOUND` | High | 6.4 | NOT_ACTIVATED |
| Stripe | BLOCKED | Missing credentials | High | 4.5 | NOT_ACTIVATED |
| WhatsApp | BLOCKED | Missing credentials | High | 4.2 | NOT_ACTIVATED |
| Sentry | PENDING | Missing DSN | Medium | 5.5 | NOT_ACTIVATED |
| OTEL | PARTIAL | Local defaults; staging exporter unvalidated | Medium | 6.8 | PARTIAL |

## Decision

Control Tower certification visibility is improved, but external provider activation remains blocked for production go-live.
