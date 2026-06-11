# SALORA Database Cleanup Audit

Date: 2026-06-05
Workspace audited: `C:\dev\salora-platform`

## Evidence Base

- Local schema file: `prisma/schema.prisma`.
- Local migrations: 9 directories under `prisma/migrations`.
- Prisma validation command passed: `prisma validate --schema prisma/schema.prisma`.
- Prisma generation command passed: `prisma generate --schema prisma/schema.prisma`.
- Generated client target from schema: `packages/backend/src/database/generated`.
- Live migration status was attempted against the configured Supabase PostgreSQL host and failed with `Schema engine error`; applied Supabase migration state is therefore not verified in this session.

## Schema Reality

- The Prisma schema defines 56 models and 24 enums.
- The schema includes auth, catalog, product media, pricing, promotions, orders, payments, reviews, conversations, WhatsApp events, AI records, inventory, loyalty, notifications, feature flags, activity logs, audit logs, roles, sessions, and runtime configuration.
- Local schema integrity is valid.
- Live Supabase drift is UNKNOWN because `prisma migrate status` did not complete successfully.

## Model Classification

| Model Area | Classification | Evidence | Finding |
|---|---:|---|---|
| Auth: `User`, `Role`, `UserRole`, `Session` | ACTIVE | Auth service, RBAC, JWT/session logic, Prisma schema. | Schema exists, but current runtime can use memory auth in non-production and throws repository unavailable in production when not wired. |
| Catalog: `ProductCategory`, `CatalogProduct`, `ProductImage` | ACTIVE | Control Tower products/media APIs, public menu DB read path, Prisma generated client. | Core DB-backed commerce area. |
| Product media: `ProductMediaDraft` | ACTIVE | Control Tower media and AI Studio routes write draft records. | Active for AI/media workflow if live table exists. |
| Pricing: `Coupon`, `CouponRedemption`, `Promotion`, `PromotionProduct` | ACTIVE | Control Tower simple-launch coupon/promotion routes and revenue section. | Active, but production usage volume not verified. |
| Product option models: `ProductVariant`, `ProductAddon`, `ProductModifier`, `PricingRule`, `AvailabilityRule` | PARTIAL | Present in schema; no strong route evidence found in the main Control Tower paths. | Keep; requires feature ownership review before deletion. |
| Orders/payments: `CafeOrder`, `OrderItem`, `OrderTimeline`, `Payment`, `PaymentIntent`, `Refund`, payment audit/reconciliation/event models | ACTIVE | Orders and payments API routes, COD discount migration, tests. | Active, but external payment provider behavior was not live-verified. |
| Customer profile extensions: addresses, preferences, favorites, saved orders, reviews | PARTIAL | Schema exists; public/customer APIs are partly in-memory. | Persisted customer feature surface is not fully verified. |
| Conversation and WhatsApp models | ACTIVE | WhatsApp enterprise migration and webhook routes. | Active integration schema, but duplicate webhook surfaces exist. |
| AI records: `AiEvaluationRecord`, `AiRecommendationRecord` | ACTIVE | AI gateway persistence and Control Tower AI routes. | Active, with mock-provider fallback possible. |
| Inventory: `Supplier`, `Ingredient`, `StockMovement`, `ConsumptionRecord` | PARTIAL | Schema exists; inventory API/domain services include in-memory paths. | DB persistence coverage needs route-by-route hardening. |
| Loyalty/rewards | PARTIAL | Schema exists; loyalty API/domain service uses in-memory paths. | Not fully DB-backed from inspected API path. |
| Notifications | PARTIAL | Schema exists; notification domain service includes in-memory paths. | Runtime notification delivery not fully verified. |
| `FeatureFlag`, `RuntimeConfiguration`, `ActivityLog`, `AuditLog` | ACTIVE | Control Tower governance/runtime/config/simple-launch APIs. | Active operational metadata. |

## Drift and Cleanup Findings

- Local Prisma schema is valid.
- Applied Supabase migration status is not proven.
- Duplicate generated client artifact exists at `apps/web/generated/prisma`; canonical output is `packages/backend/src/database/generated`.
- Some schema domains are ahead of API/runtime implementation and should be treated as PARTIAL, not unused, until production traffic and code ownership are verified.

## Index and Query Risks

- Control Tower product/media APIs can load large unpaginated datasets.
- Dashboard order queries use bounded reads, but should be reviewed for compound indexes aligned to `status` and `createdAt`.
- Media draft/product image flows should enforce production-safe constraints for primary images and duplicate media.

## Cleanup Recommendation

- Do not drop tables or models in this phase.
- Verify live Supabase migration status from a network-capable environment.
- After live drift is known, produce a separate additive-only migration plan for indexes and constraints.
