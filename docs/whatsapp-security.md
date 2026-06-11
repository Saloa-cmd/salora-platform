# WhatsApp Security

## Controls

- Disabled by default with `WHATSAPP_ENABLED=false`.
- Webhook verification token for Meta challenge.
- HMAC signature validation using `WHATSAPP_APP_SECRET`.
- Sanitized inbound text.
- No hardcoded secrets.
- No payment handling.
- PII-minimized conversation metadata.
- AI safety layer remains active through the AI Gateway.

## Production Requirements

- Set `WHATSAPP_APP_SECRET`.
- Set `WHATSAPP_VERIFY_TOKEN`.
- Set `WHATSAPP_PHONE_NUMBER_ID`.
- Set `WHATSAPP_ACCESS_TOKEN`.
- Confirm webhook retry idempotency with persistent provider message ids.
- Configure alerting on webhook failures and delivery failure rates.
