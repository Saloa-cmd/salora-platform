# SALORA Website Runtime Validation

Date: 2026-06-04  
Scope: website data flow from `apps/web` to API/database.

## Executive Status

**PARTIAL**

## Data Flow Evidence

| Data | Status | Evidence |
|---|---|---|
| Products | PARTIAL | `apps/web/lib/server/publicMenu.ts` reads `catalogProduct.findMany`; live DB has `catalog_products`; runtime `DATABASE_URL` fails |
| Categories | PARTIAL | public menu includes `category`; live DB has `product_categories`; runtime `DATABASE_URL` fails |
| Prices | PARTIAL | mapped from `basePrice` in `publicMenu.ts`; runtime DB blocked |
| Promotions | UNKNOWN | live `promotions` table exists; no verified public website promotion data flow found |
| Availability | UNKNOWN | `availability_rules` exists in Prisma, but no verified website read path found |
| Images | PARTIAL | public menu includes `images`; live `product_images` table exists but count was 0 |

## Mock / Fallback Data

Mock or fallback source remains:
- `packages/data/src/index.ts`

Website fallback path:
- `apps/web/lib/server/publicMenu.ts` catches database errors and returns `fallbackProducts`.

Runtime impact:
- Because `DATABASE_URL` is blocked, the website can silently render fallback products instead of Supabase products.

## Disconnected APIs

- Public website promotion display was not verified.
- Public website availability display was not verified.

## Final Status

**PARTIAL**

The website has a database-backed product path in code, but the current runtime can fall back to mock/static data.
