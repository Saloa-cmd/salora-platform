# Control Tower Simple Launch API Gap Review

Date: 2026-06-03

## API Gap Table

| Group | Existing routes | Missing routes | RBAC | Zod | Activity/Audit | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| products | `/api/products` | DB list/update/archive/restore/price/status | PARTIAL | PARTIAL | MISSING | Current route writes in-memory, not Supabase. |
| categories | None dedicated | list/create/update/reorder | MISSING | MISSING | MISSING | Control Tower cannot manage real categories. |
| product-images | None dedicated | list/add/set-primary/archive | MISSING | MISSING | MISSING | Product image gap cannot be closed in UI. |
| promotions | None dedicated | list/create/toggle/expire | MISSING | MISSING | MISSING | Opening offers not manageable. |
| coupons | None dedicated | list/create/toggle/usage | MISSING | MISSING | MISSING | Launch coupons not manageable. |
| feature-flags | None dedicated | list/toggle | MISSING | MISSING | MISSING | Flags exist in DB but not Control Tower. |
| runtime-config | `/api/control-tower/config` | secret filtering, safer patch semantics | CONNECTED | CONNECTED | MISSING | Existing route can write arbitrary config. |
| ai-product-tools | `/api/ai/product-explainer` adjacent | admin draft operations | PARTIAL | PARTIAL | MISSING | AI can answer, but product drafts are not governed. |
| activity-logs | None dedicated | read/search | MISSING | MISSING | N/A | Logs exist but not visible. |
| audit-logs | None dedicated | read/search | MISSING | MISSING | N/A | Governance record not visible. |

## P0 API Contract

Use `/api/control-tower/simple-launch/*` for new P0 operations to avoid breaking public routes:

- `GET/POST/PATCH /api/control-tower/simple-launch/products`
- `GET/POST/PATCH /api/control-tower/simple-launch/categories`
- `GET/POST/PATCH /api/control-tower/simple-launch/product-images`
- `GET/POST/PATCH /api/control-tower/simple-launch/promotions`
- `GET/POST/PATCH /api/control-tower/simple-launch/coupons`
- `GET/PATCH /api/control-tower/simple-launch/feature-flags`
- `GET/PATCH /api/control-tower/simple-launch/runtime-config`
- `POST /api/control-tower/simple-launch/ai-product-tools`
- `GET /api/control-tower/simple-launch/activity-logs`
- `GET /api/control-tower/simple-launch/audit-logs`

## Safety Requirements

Every mutation must:

- Require existing auth/RBAC.
- Validate with Zod.
- Use or create a correlation/request ID.
- Write `activity_logs`.
- Write `audit_logs` for material changes.
- Avoid hard deletes.
- Avoid secret exposure.
- Avoid customer/order/payment mutation.

## Post-Implementation Update

Status: P0 gaps implemented for Simple Launch.

Implemented route group:

- `/api/control-tower/simple-launch/products`
- `/api/control-tower/simple-launch/categories`
- `/api/control-tower/simple-launch/product-images`
- `/api/control-tower/simple-launch/promotions`
- `/api/control-tower/simple-launch/coupons`
- `/api/control-tower/simple-launch/feature-flags`
- `/api/control-tower/simple-launch/runtime-config`
- `/api/control-tower/simple-launch/ai-product-tools`
- `/api/control-tower/simple-launch/activity-logs`
- `/api/control-tower/simple-launch/audit-logs`

Public product read path:

- `/api/products` now reads active `catalog_products` from Prisma/Supabase and maps them to the public product contract.

Remaining non-P0 items:

- Hard delete remains intentionally unavailable.
- Advanced CMS, automation builder, WhatsApp operations, Gemini operations, branch/location management, reservations, and advanced approvals remain excluded.
