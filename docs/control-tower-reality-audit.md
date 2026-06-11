# SALORA Control Tower Reality Audit

Date: 2026-06-04  
Scope: `apps/web/app/(control-tower)`, `apps/web/components/control-tower`, `apps/web/app/api/control-tower/*`, live database evidence.

## Executive Finding

Control Tower state is **PARTIAL**.

Evidence:
- `apps/control-tower` does not exist.
- Control Tower is implemented inside `apps/web/app/(control-tower)` and `apps/web/components/control-tower`.
- Registry exists at `apps/web/lib/control-tower/registry.ts`.
- Main route exists at `/control-tower`.
- Runtime database access through `DATABASE_URL` is blocked by Prisma `P1000`; direct DB reads through `DIRECT_URL` work.
- Latest Control Tower media migration is not deployed to Supabase; `product_media_drafts` is missing.

## Screen Reality Matrix

| Section | Screen Exists | API Exists | Database Connected | CRUD Works | AI Connected | Production Ready | Evidence |
|---|---:|---:|---:|---:|---:|---:|---|
| Products | YES | YES | PARTIAL | PARTIAL | YES | PARTIAL | `SimpleLaunchOperationsCenter.tsx`; `/api/control-tower/simple-launch/products`; `catalog_products` live count 96; runtime DB pooler blocked |
| Categories | YES | YES | PARTIAL | PARTIAL | NO | PARTIAL | `/api/control-tower/simple-launch/categories`; `product_categories` live count 15 |
| Inventory | YES | YES | PARTIAL | PARTIAL | NO | PARTIAL | `NoCodeActionPanel.tsx`; `/api/inventory`; live `ingredients` and `stock_movements` count 0; some domain services are in-memory |
| Promotions | YES | YES | PARTIAL | PARTIAL | NO | PARTIAL | `/api/control-tower/simple-launch/promotions`; `promotions` live count 2 |
| Coupons | YES | YES | PARTIAL | PARTIAL | NO | PARTIAL | `/api/control-tower/simple-launch/coupons`; `coupons` live count 2 |
| AI Studio | YES | YES | PARTIAL | PARTIAL | YES | PARTIAL | `/api/control-tower/ai-studio`; text drafts use `ai_recommendation_records`; image drafts require missing `product_media_drafts` |
| Orders | YES | YES | PARTIAL | PARTIAL | NO | PARTIAL | `/api/control-tower/orders`; `cafe_orders` live count 0; runtime DB blocked |
| Customers | YES | YES | PARTIAL | PARTIAL | NO | PARTIAL | customers section registered; `customer_profiles` live count 0; customer APIs include non-DB domain services |
| WhatsApp | YES | YES | BLOCKED | BLOCKED | PARTIAL | BLOCKED | `WhatsAppCommandCenter.tsx`; `/api/control-tower/whatsapp`; `whatsapp_webhook_events` missing |
| Instagram | YES | YES | PARTIAL | PARTIAL | PARTIAL | PARTIAL | `/api/control-tower/instagram`; creates AI draft records, no Instagram provider integration |
| Settings | YES | YES | PARTIAL | PARTIAL | NO | PARTIAL | runtime config API exists; `runtime_configurations` live count 3 |
| Feature Flags | YES | YES | PARTIAL | PARTIAL | NO | PARTIAL | `/api/control-tower/simple-launch/feature-flags`; `feature_flags` live count 6 |
| Logs | YES | YES | PARTIAL | READ ONLY | NO | PARTIAL | `/api/control-tower/simple-launch/activity-logs`; `/audit-logs`; both live counts 0 |
| Media System | YES | YES | BLOCKED | BLOCKED | PARTIAL | BLOCKED | `/api/control-tower/media`; `product_media_drafts` missing in live Supabase |

## Connected vs Disconnected

Connected:
- Product management is connected to `catalog_products`.
- Categories are connected to `product_categories`.
- Coupons and promotions are connected to deployed tables.
- Runtime configuration is connected to `runtime_configurations`.
- Feature flags are connected to `feature_flags`.

Partially connected:
- Orders have database-backed APIs but no live order records and runtime DB access is blocked.
- Customers have database schema but no live records and incomplete verified Control Tower workflows.
- AI Studio can produce text drafts in code, but no live draft records exist and media draft persistence is blocked.

Disconnected or blocked:
- WhatsApp Command Center exists in UI, but required webhook event table is not deployed.
- Media draft workflow references a table absent from live Supabase.
- `apps/control-tower` requested in the audit scope does not exist as an app.

## Control Tower Conclusion

The Control Tower is not a separate app and is not fully production-ready. It has real screens and several database-backed APIs, but runtime connectivity and missing deployed tables block certification for WhatsApp, media, and parts of AI Studio.
