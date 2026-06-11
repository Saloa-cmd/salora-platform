# Payment Security

SALORA is designed to stay outside PCI-sensitive card handling.

## PCI Boundary

SALORA never accepts or stores card numbers, CVC/CVV, PAN, or expiry data. Payment method details must remain inside Stripe-hosted or provider-managed surfaces.

## Controls

- Webhook signature validation.
- Provider event idempotency.
- Secret governance through environment variables.
- Safe error redaction.
- Refund RBAC: MANAGER or ADMIN only.
- Rate limiting for payment operations.
- Payment audit logs.

## Forbidden

- Hardcoded Stripe secrets.
- Raw card data.
- Fake live payment success.
- Raw provider payload exposure to AI.
