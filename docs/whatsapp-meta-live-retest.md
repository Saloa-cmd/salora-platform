# WhatsApp Meta Live Retest

Date: 2026-06-04
Scope: Retest blockers only. No new features, APIs, dashboards, or schema changes.

## Send Test Message

Status: BLOCKED.

Evidence:

- Live Meta request reached the Cloud API.
- Both recipient variants returned the same failure:
  - HTTP 400
  - Meta code `100`
  - `(#100) Invalid parameter`

Recipient variants tested:

- existing recipient format
- digits-only recipient format

Conclusion:

The failure is not fixed by normalizing the recipient to digits only. A Meta-approved recipient or approved template path is required for the next retest.

## Receive Inbound Message

Status: BLOCKED.

Evidence:

- Signed inbound payload verification works with `WHATSAPP_APP_SECRET`.
- Processing cannot complete because `public.whatsapp_webhook_events` is missing.

## Delivery Status

Status: BLOCKED.

Evidence:

- No successful outbound provider message ID exists from Meta send.
- Status webhook processing is blocked by missing `whatsapp_webhook_events`.

## Read Status

Status: BLOCKED.

Evidence:

- A signed `read` status payload was attempted through the existing webhook processing path.
- No matching persisted conversation message existed because inbound persistence was blocked.

## Current Retest Conclusion

Live Meta retest remains blocked by:

1. Meta send invalid parameter for the current recipient/test path.
2. Missing WhatsApp webhook event table in the active database.
3. Runtime `DATABASE_URL` pooler authentication failure.

## Required Retest Inputs

1. Working `DATABASE_URL` pooler credentials, or approved runtime use of `DIRECT_URL`.
2. Applied existing WhatsApp webhook event migration.
3. Meta-approved test recipient or approved template name/language.
