# WhatsApp Activation Playbook

## Rollout Plan

1. Apply runtime persistence migration.
2. Configure `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, and `WHATSAPP_APP_SECRET` in staging.
3. Keep `WHATSAPP_ENABLED=false`.
4. Verify Meta webhook challenge.
5. Enable `WHATSAPP_ENABLED=true` in staging.
6. Send one inbound test message.
7. Replay the same webhook payload to confirm idempotency.
8. Confirm conversation and provider message records exist.

## Rollback Plan

- Set `WHATSAPP_ENABLED=false`.
- Remove webhook subscription from Meta if needed.
- Keep provider message records for audit.
- Re-run `/api/health`, `/api/ready`, and `/api/metrics`.

## Monitoring Plan

- Inbound message rate.
- Outbound message rate.
- Webhook failure rate.
- Delivery failure rate.
- Duplicate provider message count.
- Channel latency.

## Incident Plan

If WhatsApp fails, disable the channel, keep web/mobile active, inspect provider message processing status, and replay only failed records after the root cause is resolved.
