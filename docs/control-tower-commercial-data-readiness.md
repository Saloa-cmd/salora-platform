# Control Tower Commercial Data Readiness

Date: 2026-06-03

## Readiness Mapping

| Model | Control Tower capability | Readiness notes |
| --- | --- | --- |
| `ProductImage` | Product image management | Supports image storage paths, public URLs, alt text, ordering, primary image selection, metadata, and soft/archive lifecycle fields. |
| `Coupon` | Promotions/offers | Supports code-based discounts, percentage/fixed/free-item types, active windows, limits, minimum order totals, currency, metadata, archive, and soft-delete fields. |
| `CouponRedemption` | Promotions/offers redemption tracking | Connects coupons to orders and optional customers, records discount amount, and enforces one coupon redemption per order. |
| `Promotion` | Opening offers | Supports launch offer slugs, names, descriptions, status, active windows, priority, rules, metadata, archive, and soft-delete fields. |
| `PromotionProduct` | Opening offer product targeting | Connects promotions to catalog products with a composite primary key and product lookup index. |
| `FeatureFlag` | Launch controls | Supports environment-specific flags, enabled state, JSON rules, creator/updater IDs, archive, soft-delete, and unique key per environment. |
| `ActivityLog` | Governance | Captures actor, action, entity, request, IP/user-agent, metadata, and timestamp for operational activity tracing. |
| `AuditLog` | Governance | Captures audit action, actor, entity, before/after payloads, request ID, reason, and timestamp for accountable changes. |
| `AiRecommendationRecord` | AI insights | Records recommendation provider/model, customer/product links, correlation ID, score, acceptance, context, reason, and timestamp. |
| `ProductReview` | Customer feedback | Supports product/customer/order review capture, rating, title/body, moderation status, metadata, archive, and soft-delete fields. |

## Control Tower Assessment

The Prisma schema design is aligned with Simple Launch Control Tower needs. The model set supports commercial merchandising, launch controls, offer governance, customer feedback, and AI insight capture without adding branches, reservations, cafe tables, or multi-location support.

Migration readiness is blocked by generated SQL safety, not by the commercial data model design.

## Decision

Control Tower readiness: ready at schema-design level; not ready for deployment until the migration SQL is narrowed to safe additive changes.
