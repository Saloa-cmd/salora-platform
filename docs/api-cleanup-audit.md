# SALORA API Cleanup Audit

Date: 2026-06-05
Workspace audited: `C:\dev\salora-platform`

## Evidence Base

- `apps/web/app/api` contains 55 `route.ts` handlers.
- `pnpm build` succeeded and listed all API routes as dynamic server routes.
- API behavior was classified from route files and imported service modules, not from production traffic.

## API Classification

| Area | Routes | Classification | Finding |
|---|---|---:|---|
| Auth | `/api/auth/login`, `/logout`, `/me`, `/refresh`, `/register` | PARTIAL | Runtime exists. Registration accepts optional roles from request body. Production repository path is not proven ready. |
| Admin RBAC | `/api/admin/rbac-check` | ACTIVE | RBAC diagnostic route exists. |
| AI | `/api/ai/*` | ACTIVE/PARTIAL | Gateway and recommendation routes exist; real provider usage depends on env flags/keys and mock fallback. |
| AI duplicate alias | `/api/ai/chat`, `/api/ai/concierge` | DUPLICATED | Both import the same `askConcierge` flow. Keep until clients are known. |
| Control Tower core | `/api/control-tower/*` | ACTIVE/PARTIAL | Products, media, orders, governance, AI Studio, WhatsApp, Instagram routes exist. Some external provider paths not live-verified. |
| Control Tower simple-launch | `/api/control-tower/simple-launch/*` | ACTIVE | Main Control Tower CRUD/governance surface for products, coupons, promotions, flags, logs, and runtime config. |
| Public products | `/api/products` | PARTIAL | GET tries DB then falls back to static products; POST uses in-memory domain service. |
| Customers/inventory/loyalty/notifications | `/api/customers`, `/inventory`, `/loyalty`, `/notifications` | PARTIAL | Domain services contain in-memory stores. |
| Orders | `/api/orders`, `/api/order-preview`, `/api/control-tower/orders` | ACTIVE/PARTIAL | Order creation/control updates exist; overlapping surfaces require ownership review. |
| Payments | `/api/payments/*` | PARTIAL | Stripe/mock service routes exist; live Stripe/webhook verification was not performed. |
| WhatsApp | `/api/whatsapp/*`, `/api/channels/whatsapp/webhook` | DUPLICATED/PARTIAL | Two webhook surfaces exist. Meta configuration determines which is active. |
| Intelligence | `/api/intelligence/*`, `/api/telemetry/dashboard` | ACTIVE/PARTIAL | Dashboard intelligence routes exist; data freshness and production telemetry were not live-verified. |
| Runtime health | `/api/health`, `/live`, `/ready`, `/metrics`, `/runtime/inspect` | ACTIVE/PARTIAL | Health/runtime routes exist. Diagnostics token is enforced in production for sensitive diagnostics. |

## Duplicate and Legacy Surfaces

- `/api/ai/chat` and `/api/ai/concierge` are functionally duplicated aliases.
- `/api/whatsapp/webhook` and `/api/channels/whatsapp/webhook` overlap.
- `/api/control-tower/config` and `/api/control-tower/simple-launch/runtime-config` overlap.
- `/api/orders` and `/api/control-tower/orders` overlap but serve different actors.
- Public domain APIs still rely on `packages/backend/src/domains/services.ts` in-memory stores.

## Cleanup Recommendation

- Do not delete duplicated endpoints without client, webhook, and production traffic evidence.
- Create an API ownership map and mark canonical endpoints.
- Add deprecation headers before removing legacy aliases.
- Replace in-memory domain service paths with DB-backed implementations before declaring the related APIs ACTIVE.
