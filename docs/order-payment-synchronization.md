# Order Payment Synchronization

## Flow

Order Created -> Payment Intent Created -> Payment Confirmation -> Order Marked Paid -> Loyalty Awarded -> Notification Emitted -> Analytics Recorded.

## Rules

- An order cannot become paid from client-side claims.
- Duplicate webhooks must not double-update order state.
- Duplicate webhooks must not double-award loyalty.
- Refunds must synchronize payment state, order payment state, and loyalty reversal.
- Payment failures must preserve audit trail.

## Current Scope

Phase 7 prepares the synchronization model and in-runtime state. Production database migrations define durable state for activation.
