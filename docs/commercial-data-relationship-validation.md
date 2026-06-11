# Commercial Data Relationship Validation

Date: 2026-06-03

Migration reviewed: `prisma/migrations/202606030002_commercial_data_alignment_additive_only/migration.sql`

## Table Validation

| Table | Primary key | Foreign keys | Unique constraints | Indexes | Control Tower usage |
| --- | --- | --- | --- | --- | --- |
| `product_images` | `id` | `product_id` -> `catalog_products.id` | None | `(product_id, sort_order)`, `deleted_at` | Product image management, primary image ordering, soft-delete visibility. |
| `coupons` | `id` | None | `code` | `(is_active, starts_at, ends_at)`, `deleted_at` | Promotions/offers setup and lifecycle governance. |
| `coupon_redemptions` | `id` | `coupon_id` -> `coupons.id`; `order_id` -> `cafe_orders.id`; `customer_id` -> `customer_profiles.id` | `order_id` | `(coupon_id, created_at)`, `(customer_id, coupon_id)` | Coupon usage tracking and customer/order attribution. |
| `promotions` | `id` | None | `slug` | `(status, starts_at, ends_at)`, `deleted_at` | Opening offers and campaign scheduling. |
| `promotion_products` | `(promotion_id, product_id)` | `promotion_id` -> `promotions.id`; `product_id` -> `catalog_products.id` | Composite primary key prevents duplicates | `product_id` | Product targeting for launch offers. |
| `product_reviews` | `id` | `product_id` -> `catalog_products.id`; `customer_id` -> `customer_profiles.id`; `order_id` -> `cafe_orders.id` | None | `(product_id, status)`, `customer_id`, `deleted_at` | Customer feedback, moderation, product quality signals. |
| `ai_recommendation_records` | `id` | `customer_id` -> `customer_profiles.id`; `product_id` -> `catalog_products.id` | None | `(customer_id, created_at)`, `(product_id, created_at)`, `(provider, model)` | AI insight capture and recommendation analytics. |
| `feature_flags` | `id` | None | `(key, environment)` | `(environment, enabled)`, `deleted_at` | Launch controls and environment-specific rollout gates. |
| `activity_logs` | `id` | None | None | `(actor_id, created_at)`, `(entity_type, entity_id)`, `created_at` | Operational activity traceability. |
| `audit_logs` | `id` | None | None | `(entity_type, entity_id, created_at)`, `(actor_id, created_at)`, `(action, created_at)` | Governance, change accountability, compliance review. |

## Referenced Certified Tables

The curated migration references existing certified tables only as FK targets:

- `catalog_products`
- `cafe_orders`
- `customer_profiles`

No existing foreign keys are dropped or recreated. No existing table columns are altered.
