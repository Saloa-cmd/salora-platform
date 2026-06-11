# Control Tower Security Impact

Date: 2026-06-08

## Scope

Assess impact of the generated RLS plan on existing Control Tower capabilities.

No SQL was applied.

## Impact Matrix

| Control Tower Area | Tables | Expected Impact | Required Verification |
| --- | --- | --- | --- |
| Products | `catalog_products`, `product_categories`, variants/addons/modifiers/images | Should continue through server Prisma; direct public reads limited to active content. | List, create/update/archive product in staging after RLS. |
| Orders | `cafe_orders`, `order_items`, `order_timeline`, `order_notes` | Staff/admin policies exist for direct access, but app remains server-Prisma authority. | Order list and status update through Control Tower. |
| Media | `product_media_drafts`, `product_images` | Drafts restricted to staff/manager; public images only active/non-deleted. | Draft create/approve/publish workflow in staging. |
| Customers | `customer_profiles`, addresses/preferences | Owner/staff split; Control Tower staff reads should work if direct JWT roles exist, otherwise server Prisma path must be service credential. | Customer read/list if existing Control Tower route uses these tables. |
| AI Studio | `product_media_drafts`, `ai_evaluation_records`, `ai_recommendation_records` | Manager/service write protected. | AI Studio create draft and log AI evaluation in staging. |
| WhatsApp | `whatsapp_webhook_events`, `provider_messages`, `conversations`, messages | Webhook tables are service-role only; server integration must use service/owner Prisma. | Webhook receive/process/mark failed. |
| Promotions | `promotions`, `promotion_products` | Public active read only; manager write. | Create/pause/archive promotion. |
| Coupons | `coupons`, `coupon_redemptions` | Active coupon metadata public; redemption ledger protected. | Coupon list/update and redemption write path. |
| Runtime Config | `runtime_configurations`, `feature_flags` | Admin-only direct access; server runtime must remain authoritative. | Runtime config read/write in Control Tower. |
| Logs | `activity_logs`, `audit_logs` | Manager/admin read; service write. | Audit/activity list and write after a mutation. |

## Security Improvements

- Public schema direct reads no longer expose PII/order/auth/log tables.
- Public catalog exposure is restricted to active menu content.
- Webhook payloads, sessions, password hashes, and audit logs become inaccessible to `anon`.
- Admin data is separated from customer owner-only surfaces.

## Runtime Risk

The plan is compatible if the application continues to use server-side Prisma with owner/service credentials. If any Control Tower route is later moved to direct Supabase client access, the Supabase JWT must include app roles compatible with `salora_has_role()`.

## Deployment Strategy

1. Apply to staging after backup.
2. Run validation gates.
3. Run Control Tower smoke tests for products, orders, media, promotions, coupons, runtime config, and logs.
4. Confirm Supabase Advisor issue count reduction.
5. Promote to production only after evidence is captured.
