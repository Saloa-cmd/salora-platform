# Revenue Platform

SALORA Phase 7 introduces first-class revenue infrastructure. Payments are integrated with orders, customers, loyalty, notifications, AI context, analytics, observability, security, and operations readiness.

## Architecture

- Payment Domain owns internal payment records, refunds, events, audit logs, method references, and reconciliation records.
- Payment Provider abstraction isolates Stripe and mock behavior.
- Order synchronization only marks orders paid after normalized provider confirmation or verified webhook processing.
- Loyalty points are awarded only for paid orders and reversed on successful refunds.
- Revenue analytics derive safe aggregate metrics without storing card data.

Live payments are disabled by default with `PAYMENTS_ENABLED=false` and `STRIPE_ENABLED=false`.
