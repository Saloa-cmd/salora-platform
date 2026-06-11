# Control Tower Simple Launch Operations Matrix

Date: 2026-06-03

## Matrix

| Entity | Operation | Status | Implementation note |
| --- | --- | --- | --- |
| Products | list | P0 | DB-backed route required. |
| Products | create | P0 | Existing route is in-memory; replace/bind to Prisma. |
| Products | update | P0 | Add safe update by slug/id. |
| Products | archive | P0 | Set status/archived signal, no hard delete. |
| Products | restore | P0 | Restore to `ACTIVE`. |
| Products | price update | P0 | Update `base_price` with audit record. |
| Products | image link/update | P0 | Use `ProductImage` URL management. |
| Products | status toggle | P0 | Toggle `ACTIVE`, `PAUSED`, `ARCHIVED`. |
| Categories | list | P0 | DB-backed list. |
| Categories | create | P0 | Slug idempotency. |
| Categories | update | P0 | Name/sort order only. |
| Categories | archive | Postpone | No archive column exists; avoid schema change. |
| Categories | reorder | P0 | Use `sort_order`. |
| Product Images | list by product | P0 | DB-backed by product slug/id. |
| Product Images | add image URL | P0 | URL/storage path only when real URL exists. |
| Product Images | set primary image | P0 | One primary per product in transaction. |
| Product Images | remove/archive image | P0 | Set `archived_at`/`deleted_at`; no hard delete. |
| Promotions | list | P0 | DB-backed list. |
| Promotions | create | P0 | Modest launch metadata/rules. |
| Promotions | activate | P0 | Status `ACTIVE`. |
| Promotions | deactivate | P0 | Status `PAUSED`. |
| Promotions | expire | P0 | Status `ARCHIVED` or set `ends_at`. |
| Coupons | list | P0 | DB-backed list. |
| Coupons | create | P0 | Guard extreme discounts. |
| Coupons | activate | P0 | `is_active = true`. |
| Coupons | deactivate | P0 | `is_active = false`. |
| Coupons | track usage | PARTIAL | `coupon_redemptions` supports usage; reporting route can count. |
| Feature Flags | list | P0 | DB-backed by environment. |
| Feature Flags | toggle | P0 | `enabled` update by key/environment. |
| Runtime Configuration | list | PARTIAL | Existing route exists; must filter secrets. |
| Runtime Configuration | update non-secret values | PARTIAL | Existing route writes; add secret-key guard. |
| AI Product Operations | description draft | P0 | Use AI Gateway, return/store reviewable record. |
| AI Product Operations | short copy draft | P0 | Same route with operation enum. |
| AI Product Operations | pairing/category/upsell | P0 | Same route with operation enum. |
| AI Product Operations | image prompt | P0 | Prompt only; no image generation. |
| Logs | activity logs | P0 | Read-only route plus mutation writes. |
| Logs | audit logs | P0 | Read-only route plus material mutation writes. |
| Logs | correlation ID search | P0 | Query by `request_id` where provided. |

## Consistency Boundary

Commercial mutations should be single database transactions where they touch primary data plus activity/audit logs. AI drafts should never auto-publish to product fields.
