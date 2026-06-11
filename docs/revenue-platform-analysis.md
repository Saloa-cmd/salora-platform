# Revenue Platform Analysis

SALORA is a production launch candidate with orders, customers, loyalty, notifications, AI runtime, recommendations, WhatsApp channel architecture, conversation persistence, auth/RBAC, observability, and go-live governance. Phase 7 turns those foundations into revenue infrastructure without handling card data or enabling live payments by default.

## Revenue Architecture Options

1. Direct provider integration in API routes: fast, but high coupling and weak testability.
2. Payment provider abstraction: slightly more structure, best fit for SALORA because Stripe should be replaceable and CI must use deterministic mock behavior.
3. Full payment orchestration service: useful later when multiple providers, subscriptions, and settlement complexity exist.

Recommended strategy: provider abstraction plus first-class Payment Domain, with Stripe behind the abstraction and mock provider as default.

## Payment Lifecycle Map

Order created -> payment intent created -> provider confirmation/webhook verified -> payment marked paid -> order payment state synchronized -> loyalty awarded -> notification event emitted -> revenue analytics updated.

## Refund Lifecycle Map

Refund requested by manager/admin -> provider refund created -> webhook/status verified -> refund recorded -> payment/order state synchronized -> loyalty reversed where applicable -> notification event emitted -> analytics updated.

## Order-Payment Synchronization Model

Orders must not become paid from client-side claims. SALORA updates payment/order state only through normalized provider results or verified webhook events. Duplicate provider events must be idempotent.

## Loyalty Impact Model

Points are awarded only after verified payment success. Refunds create reversal ledger entries and must not duplicate through webhook replay.

## WhatsApp Impact Model

WhatsApp can present payment status and payment-ready order assistance later, but it must not own payment logic. It remains a channel over the Order and Payment domains.

## AI Personalization Impact Model

AI may use paid order summaries, product categories, loyalty tier, refund-safe customer value bands, and aggregate revenue behavior. AI must never receive card data, secrets, raw provider payloads, or sensitive audit logs.

## Analytics Requirements

Gross revenue, net revenue, AOV, success rate, refund rate, failed payment rate, revenue by product, revenue by channel, loyalty impact, and AI recommendation conversion readiness.

## Risks

- Operational: webhook misconfiguration, duplicate events, delayed provider status.
- Accounting: partial refunds, currency mismatch, settlement reconciliation.
- Security: webhook spoofing, accidental secret exposure, unsafe refund access.
- Rollback: payments must be disabled with `PAYMENTS_ENABLED=false` and `STRIPE_ENABLED=false` without corrupting order state.

## Recommended Implementation Strategy

Build Payment Domain, provider abstraction, mock provider, Stripe-disabled integration, idempotent webhook handling, order/loyalty/notification synchronization, revenue analytics, observability metrics, secured APIs, and activation docs. Keep live Stripe disabled until staging secrets, webhook secret, monitoring, and rollback are verified.
