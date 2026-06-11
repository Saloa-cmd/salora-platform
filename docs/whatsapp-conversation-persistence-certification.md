# WhatsApp Conversation Persistence Certification

Date: 2026-06-04
Scope: Verification after database connectivity investigation. No schema changes were applied.

## Status

BLOCKED.

## Database State

Using `DIRECT_URL` as a temporary runtime override proved direct connectivity, but persistence still failed because the required table is not present in the current database.

Missing table:

- `public.whatsapp_webhook_events`

## Verification Results

| Entity | Result | Evidence |
| --- | --- | --- |
| `WhatsappWebhookEvent` | BLOCKED | Table `public.whatsapp_webhook_events` does not exist. |
| `Conversation` | FAIL | Webhook processing stops before conversation persistence because webhook event persistence fails first. |
| `ConversationMessage` | FAIL | No inbound conversation message was persisted for the certification payload. |
| `ProviderMessage` | FAIL | No provider message was persisted for the certification payload. |
| delivery/read status | FAIL | No matching conversation message existed to update to `READ`. |

## Root Cause

The additive migration containing `whatsapp_webhook_events` has not been applied to the active Supabase database.

Migration file present locally:

- `prisma/migrations/202606040001_whatsapp_enterprise_events/migration.sql`

## Required Resolution

Apply the existing migration to the target Supabase database using the approved deployment/migration process. This is not performed in this blocker-resolution run because the instruction explicitly forbids database schema changes.

After migration is applied:

1. Rerun inbound webhook processing.
2. Confirm `WhatsappWebhookEvent` is created.
3. Confirm `ProviderMessage` is created or updated.
4. Confirm `Conversation` and `ConversationMessage` are created.
5. Confirm read/delivery status updates the matching `ConversationMessage`.
