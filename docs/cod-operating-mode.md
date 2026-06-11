# COD Operating Mode

Date: 2026-06-03

## Status

Status: IMPLEMENTED_PENDING_MIGRATION_DEPLOYMENT

Cash On Delivery is implemented as the Phase 1 commercial launch payment path. Stripe remains Phase 2.

## Runtime Configuration

Required launch values:

```text
PAYMENT_COD_ENABLED=true
PAYMENT_STRIPE_ENABLED=false
```

## Order Lifecycle

```text
PENDING_CONFIRMATION
-> PREPARING
-> READY
-> DELIVERED
```

`CANCELLED` is allowed before delivery.

## Data Behavior

- Public `/api/orders` now creates DB-backed COD orders.
- Control Tower `/api/control-tower/orders` can list and update DB-backed orders.
- Payment provider is stored as `cod`.
- No Stripe PaymentIntent is created for COD.
- Order timeline records are created for status changes.

## Safety

- Invalid transitions return a safe conflict response.
- Control Tower mutations require order permissions.
- ActivityLog and AuditLog are written for Control Tower order changes.
