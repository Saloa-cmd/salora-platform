# Payment Incident Runbook

## Stripe Outage

1. Set `STRIPE_ENABLED=false`.
2. Set `PAYMENT_PROVIDER=mock` only for internal testing, not live checkout.
3. Pause checkout links.
4. Inspect webhook failures and provider status.
5. Resume only after staging validation passes.

## Webhook Replay

1. Check `PaymentEvent` uniqueness by provider event id.
2. Process only failed events.
3. Confirm loyalty was not duplicated.
4. Confirm notifications were not duplicated.

## Refund Incident

1. Restrict refund API to ADMIN only if needed.
2. Review audit logs.
3. Reconcile provider refund status.
4. Reverse loyalty only once.
