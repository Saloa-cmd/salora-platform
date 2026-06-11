# SALORA WhatsApp Commercial Readiness

Date: 2026-06-08

Scope: WhatsApp webhook, send route, provider configuration, persistence tables, Control Tower WhatsApp route, recipient/customer-send readiness.

No WhatsApp message was sent. No webhook event was inserted manually. No customer data was modified.

## Decision

PARTIAL

WhatsApp integration code and required environment key names are present, webhook verification/signature handling exists, and persistence tables exist. Commercial readiness remains partial because no Meta delivery test, customer opt-in proof, recipient restriction review, or live webhook delivery evidence was collected.

## Evidence

| Area | Evidence | Result |
| --- | --- | --- |
| Canonical webhook route | `/api/whatsapp/webhook` exists in build output | PASS in code |
| Legacy webhook route | `/api/channels/whatsapp/webhook` also exists | PARTIAL, route ownership should be clarified |
| Signature verification | Webhook handler verifies `x-hub-signature-256` with app secret before processing | PASS in code |
| Send route | `/api/whatsapp/send` exists and uses Meta Graph API client | PASS in code |
| Environment key names | `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, and related keys are present by name | PARTIAL, values not printed |
| Persistence | `whatsapp_webhook_events` exists; live count is 0 | PARTIAL |
| Control Tower route | `/api/control-tower/whatsapp` exists and requires permissions | PASS in code |
| Failure visibility | Some Control Tower WhatsApp reads catch failures and return empty arrays | RISK |
| Live customer send | Not executed | BLOCKED for full commercial certification |

## Required Actions

1. Confirm Meta app, phone number, WABA identity, verify token, and app secret in staging.
2. Run a webhook challenge and signed webhook delivery test.
3. Confirm customer opt-in and allowed recipient policy.
4. Replace masked empty-array fallbacks with visible operational failure state where appropriate.
5. Run a controlled non-customer staging send before customer opt-in launch.

