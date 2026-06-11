# Stripe Integration

Stripe is implemented behind SALORA's payment provider abstraction.

## Supported

- Payment Intents.
- Payment confirmation.
- Refunds.
- Webhook parsing.
- Webhook signature verification.
- Idempotency keys.
- Metadata mapping.
- Safe error handling.

## Disabled Default

Stripe requires:

- `PAYMENTS_ENABLED=true`
- `STRIPE_ENABLED=true`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Monitoring and rollback path

Local tests do not require Stripe keys.
