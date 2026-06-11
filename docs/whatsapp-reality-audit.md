# SALORA WhatsApp Reality Audit

Date: 2026-06-04  
Scope: WhatsApp routes, integration package, Meta live test evidence, Prisma/Supabase persistence evidence, Control Tower visibility.

## Executive Finding

WhatsApp state is **BLOCKED**.

This is the actual runtime status, not the code status.

## Evidence Summary

| Check | Status | Evidence |
|---|---|---|
| Meta credential names present | PARTIAL | Local environment contains WhatsApp credential keys; secret values are not printed |
| App secret present | PARTIAL | `WHATSAPP_APP_SECRET` key exists locally; value is not printed |
| Phone number ID verified with Meta | ACTIVE | Previous Graph inspection returned matching phone number object and Cloud API platform metadata |
| Webhook verification logic | PARTIAL | Verification code exists and service-level verification passed previously |
| Webhook verification endpoint | UNKNOWN | Full HTTP endpoint verification was not completed in this audit |
| Message sending | BLOCKED | Previous live Meta send returned HTTP 400, Meta code 100 `Invalid parameter` |
| Message receiving | UNKNOWN | No actual inbound Meta webhook delivery was verified |
| Webhook event persistence | BLOCKED | `whatsapp_webhook_events` exists in Prisma/local migration but not in live Supabase |
| Conversation persistence | BLOCKED | `conversations`, `conversation_messages`, `provider_messages` exist but live counts are 0 and runtime DB pooler is blocked |
| Delivery/read status tracking | BLOCKED | `provider_messages` exists but no live delivery/read webhook persisted |
| Control Tower visibility | PARTIAL | `WhatsAppCommandCenter.tsx` exists; live conversation visibility not certified |
| COD notification readiness | BLOCKED | Order route can call WhatsApp notification code, but WhatsApp send is blocked |

## Code Reality

Existing code:
- `packages/backend/src/integrations/whatsapp`
- `apps/web/app/api/whatsapp/send`
- `apps/web/app/api/whatsapp/webhook`
- `apps/web/app/api/control-tower/whatsapp`
- `apps/web/components/control-tower/WhatsAppCommandCenter.tsx`

## Database Reality

| Object | Prisma | Migration | Live Supabase | Status |
|---|---:|---:|---:|---|
| `conversations` | YES | YES | YES | PARTIAL |
| `conversation_messages` | YES | YES | YES | PARTIAL |
| `provider_messages` | YES | YES | YES | PARTIAL |
| `whatsapp_webhook_events` | YES | YES | NO | BLOCKED |

## WhatsApp Conclusion

WhatsApp is implemented in code but not production-active. The live Meta send test failed, inbound webhook receipt is not proven, and the required webhook event table is absent from Supabase.
