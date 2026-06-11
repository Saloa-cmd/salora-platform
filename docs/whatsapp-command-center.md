# WhatsApp Command Center

Date: 2026-06-03

## Status

Status: IMPLEMENTED_AS_BLOCKED_UNTIL_META_READY

Target contact: `+968 9023 9624`

## Capabilities

| Capability | Status |
| --- | --- |
| Readiness status | IMPLEMENTED |
| Draft command content | IMPLEMENTED |
| Order notifications | BLOCKED until Meta credentials validate |
| Order confirmations | BLOCKED until Meta credentials validate |
| Promotional campaigns | DRAFT_ONLY |
| AI-assisted replies | BLOCKED until webhook and credentials certify |

## Required Credentials

- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`

Secrets are never displayed in Control Tower.

## API

Route: `/api/control-tower/whatsapp`

GET returns readiness and target contact. POST creates draft-only command records and does not send messages.
