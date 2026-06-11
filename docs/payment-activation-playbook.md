# Payment Activation Playbook

## Local and CI

- Keep `PAYMENTS_ENABLED=false`.
- Keep `PAYMENT_PROVIDER=mock`.
- Keep `STRIPE_ENABLED=false`.

## Stripe Staging

1. Configure Stripe staging keys.
2. Configure webhook secret.
3. Apply Prisma revenue migration.
4. Set `PAYMENTS_ENABLED=true`.
5. Set `STRIPE_ENABLED=true`.
6. Set `PAYMENT_PROVIDER=stripe`.
7. Run payment validation suite.
8. Monitor payment success rate, webhook failures, duplicate events, and refund behavior.

## Production

Promote only after staging payments, refunds, and webhook replay pass.

## Rollback

- Set `PAYMENT_PROVIDER=mock`.
- Set `STRIPE_ENABLED=false`.
- Set `PAYMENTS_ENABLED=false`.
- Keep payment records and provider events for audit.
