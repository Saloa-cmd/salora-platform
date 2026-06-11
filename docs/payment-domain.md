# Payment Domain

## Concepts

- Payment
- PaymentIntent
- Refund
- PaymentEvent
- PaymentMethodReference
- PaymentAuditLog
- PaymentReconciliationRecord

## Statuses

Payment statuses: `PENDING`, `REQUIRES_ACTION`, `AUTHORIZED`, `PAID`, `FAILED`, `CANCELED`, `REFUNDED`, `PARTIALLY_REFUNDED`.

Refund statuses: `PENDING`, `SUCCEEDED`, `FAILED`, `CANCELED`.

Order payment states: `UNPAID`, `PAYMENT_PENDING`, `PAID`, `PAYMENT_FAILED`, `REFUNDED`, `PARTIALLY_REFUNDED`.

## Guarantees

- No card data is accepted or stored.
- Idempotency keys are required for durable payment records.
- Provider events are unique by provider and provider event id.
- Audit logs record internal payment operations.
