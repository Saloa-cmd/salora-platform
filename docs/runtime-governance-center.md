# Runtime Governance Center

Date: 2026-06-03

## Status

Status: IMPLEMENTED

Runtime Governance is exposed through `/api/control-tower/runtime-governance` and the existing Control Tower surface.

## Providers

| Provider | Governance Data |
| --- | --- |
| PostgreSQL | Health, readiness, risk, score, last validation |
| Redis | Health, readiness, risk, score, last validation |
| Queues | Health, readiness, risk, score, last validation |
| OpenAI | Configuration readiness without secret exposure |
| Stripe | Configuration readiness and Phase 1 disabled status |
| WhatsApp | Meta credential readiness without secret exposure |
| Instagram | Meta credential readiness without secret exposure |
| Sentry | Configuration readiness without DSN exposure |

## Safety

- No secrets are displayed.
- Missing configuration is masked.
- Control Tower access requires system permission.
- Provider readiness does not activate external providers.
