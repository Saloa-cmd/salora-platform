# SALORA Simple Launch Stack

Date: 2026-06-02

## Official Launch Stack

Only these systems are approved for commercial launch scope:

1. Website
2. Mobile App Foundation
3. Control Tower
4. PostgreSQL
5. Redis
6. OpenAI
7. Stripe
8. Orders
9. Products
10. Customers
11. Loyalty
12. Revenue Analytics

## System Roles

| System | Launch Role | Status |
|---|---|---|
| Website | Customer-facing menu, product discovery, checkout entry, AI Concierge access. | KEEP |
| Mobile App Foundation | Lightweight cafe mobile experience; no expansion before launch. | KEEP |
| Control Tower | Operator surface for live actions, runtime config, readiness, and launch decisions. | KEEP |
| PostgreSQL | Source of truth for users, products, orders, payments, loyalty, runtime config. | KEEP |
| Redis | Queue/cache runtime for launch jobs and operational resilience. | KEEP |
| OpenAI | Primary AI Concierge and recommendations provider. | KEEP |
| Stripe | Payment intent, confirmation, refund, revenue sync, webhook foundation. | KEEP |
| Orders | Order lifecycle and payment synchronization. | KEEP |
| Products | Menu/catalog management and pricing base. | KEEP |
| Customers | Customer profiles, preferences, value and retention signals. | KEEP |
| Loyalty | Points, earn/reverse flows, loyalty assistant context. | KEEP |
| Revenue Analytics | Executive revenue, payment health, refund and AOV visibility. | KEEP |

## Optional for Later

| System | Decision |
|---|---|
| WhatsApp | Post-launch channel activation. |
| Gemini | Future fallback/benchmark provider only. |
| Claude | Archive as future provider. |
| Full CMS | Postpone; use runtime configuration and product APIs for launch. |
| Automation Builder | Postpone; manual operations first. |
| Integration Hub | Postpone; keep direct launch integrations. |
| Multi-tenant management | Postpone until first cafe is stable. |
| OTEL exporter | Postpone until external exporter destination is approved. |

## Control Tower Operating Model

Control Tower remains the single source of truth for commercial operations. For launch:

- Products and categories: manage through product no-code action and product API.
- Pricing, promotions, AI settings, homepage content, feature flags, recommendations, and business hours: manage through runtime configuration records.
- Inventory: manage through inventory movement action and API.
- Loyalty: manage through loyalty action and runtime configuration.
- Orders: operate through order API and operations intelligence; avoid building a new workflow editor before launch.
- Revenue: monitor through revenue dashboard and Stripe certification.

## Launch Principle

If a system does not help the cafe sell, fulfill, collect, retain, or monitor during the first 100 users, it is outside launch scope.
