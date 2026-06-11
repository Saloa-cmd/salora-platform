# SALORA Website Reality Audit

Date: 2026-06-04  
Scope: `apps/web/app`, public menu data flow, live DB data, fallback usage.

## Executive Finding

Website state is **PARTIAL**.

## Data Source Reality

| Requirement | Status | Evidence |
|---|---|---|
| Website reads products from database | PARTIAL | `apps/web/app/page.tsx` calls `getPublicMenuProducts()`; `apps/web/lib/server/publicMenu.ts` reads `catalogProduct`; live DB has 96 products |
| Website reads categories from database | PARTIAL | `getPublicMenuProducts()` includes product category; live DB has 15 categories |
| Website reads promotions | UNKNOWN | Promotions exist in DB, but no verified public website promotion read path was found |
| Website reads inventory | UNKNOWN | Inventory tables exist but no verified public website inventory read path was found |
| No mock data remains | NO | `getPublicMenuProducts()` falls back to `@salora/data`; package contains static products/categories |

## Fallback Evidence

Static fallback data exists in:
- `packages/data/src/index.ts`

Website fallback path exists in:
- `apps/web/lib/server/publicMenu.ts`

This means the website can render without database access, but it also means runtime output may not represent live Supabase data. Since `DATABASE_URL` is currently blocked, website runtime is likely to fall back unless environment configuration is corrected.

## Website Conclusion

The website has a real database-backed product path, but production certainty is blocked by the runtime database connection and remaining fallback data.
