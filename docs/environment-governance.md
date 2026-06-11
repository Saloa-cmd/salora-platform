# Environment Governance

Date: 2026-06-01

## Classification Rules

| Classification | Definition |
|---|---|
| Missing | Required secret or configuration is absent. |
| Configured | Secret is present but no live validation or activation has occurred. |
| Validated | Connectivity, health, and failure behavior have been tested. |
| Activated | Provider or infrastructure is live for the approved staging scope with rollback documented. |

## Environment Rules

1. Secrets must never be committed.
2. `.env.example` must contain placeholders only.
3. Runtime provider activation requires explicit feature flags.
4. Staging activation must not imply production activation.
5. Every external provider needs rollback, blacklist/suspension, cost or usage controls, and observability before activation.
6. Mock/fallback providers must remain available during staging.

## Current Environment State

| Area | Classification | Reason |
|---|---|---|
| PostgreSQL | Activated | Supabase migration, table verification, and seed passed. |
| Redis/BullMQ | Activated | Upstash smoke, queue, retry, DLQ, worker recovery, and metrics passed. |
| OpenAI | Configured | Credential present; real provider flag remains disabled; connectivity is quota-blocked. |
| Gemini | Configured | Credential present; real provider flag remains disabled. |
| WhatsApp | Missing | Meta staging secrets absent. |
| Stripe | Missing | Test keys and webhook secret absent. |
| Firebase | Missing | Service account not configured. |
| Sentry | Missing | DSN not configured. |
| OTEL | Pending | Defaults exist; staging exporter not validated. |

## Safety Decision

OpenAI and Gemini are not activated by this governance phase. Real provider traffic remains blocked by `AI_ENABLE_REAL_PROVIDERS=false`.
