# SALORA WhatsApp Blocker Resolution

Date: 2026-06-04  
Scope: WhatsApp credentials, endpoint, payload, webhook, persistence, Control Tower.

## Executive Status

**BLOCKED**

## Credential Review

Credential key names are present locally and values are not printed:
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_WABA_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_APP_ID`
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_VERIFY_TOKEN`

Runtime flag:
- `WHATSAPP_ENABLED=true`
- `WHATSAPP_API_VERSION=v23.0`

## Exact Failing Request

Endpoint in code:

```text
POST https://graph.facebook.com/v23.0/{PHONE_NUMBER_ID}/messages
```

Code evidence:
- `packages/backend/src/integrations/whatsapp/whatsapp.client.ts`

Sanitized text payload structure:

```json
{
  "messaging_product": "whatsapp",
  "to": "<recipient_phone>",
  "type": "text",
  "text": {
    "preview_url": false,
    "body": "<message>"
  }
}
```

Previous live result:
- HTTP `400`
- Meta error code `100`
- `Invalid parameter`

## Correct Payload

For a text message, the correct Cloud API v23 payload shape is:

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<E164 digits or allowed WhatsApp ID>",
  "type": "text",
  "text": {
    "preview_url": false,
    "body": "Test message"
  }
}
```

Current code omits `recipient_type`. Meta usually defaults to `individual`, so this is not proven as the sole root cause.

## Root Cause

Confirmed blockers:
1. Live send returns Meta `(#100) Invalid parameter`.
2. Required persistence table `whatsapp_webhook_events` is missing in Supabase.
3. Runtime database connection through `DATABASE_URL` is blocked.
4. Inbound webhook receipt was not verified.

Probable Meta-side causes to verify:
- recipient phone was not in E.164 digits-only format expected by Meta
- recipient was not authorized for the test app / not opted in
- phone number ID and access token do not belong to the same app/business scope
- required app permissions or WABA configuration are incomplete
- access token scope does not include required WhatsApp messaging permission

## Required Meta Configuration

Verify in Meta Business / Developer Console:
- Phone number is attached to the target WABA.
- Access token belongs to the same app and business.
- Token has WhatsApp messaging permissions.
- Recipient is authorized for test messaging or has opted in.
- Webhook callback URL points to `/api/whatsapp/webhook`.
- Webhook verify token matches runtime env.
- App secret is configured for signature verification.

## Persistence Status

| Object | Status | Evidence |
|---|---|---|
| `conversations` | PRESENT | live Supabase table exists |
| `conversation_messages` | PRESENT | live Supabase table exists |
| `provider_messages` | PRESENT | live Supabase table exists |
| `whatsapp_webhook_events` | MISSING | absent from live Supabase |

## Control Tower Integration

Status: **PARTIAL**

Evidence:
- `apps/web/components/control-tower/WhatsAppCommandCenter.tsx` exists.
- `/api/control-tower/whatsapp` exists.
- Live persistence and webhook event table are blocked.

## Final Decision

**BLOCKED**

Do not mark WhatsApp active until:
- Meta send succeeds
- inbound webhook is received
- webhook event persists
- conversation/message/provider status rows persist
- Control Tower displays the persisted conversation
