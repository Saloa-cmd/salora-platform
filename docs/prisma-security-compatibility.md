# Prisma Security Compatibility

Date: 2026-06-08

## Scope

Validate that the generated RLS hardening plan remains compatible with SALORA's Prisma-first server runtime.

No SQL was applied. No migration was run.

## Current Runtime Model

SALORA server routes use Prisma through `getPrismaClient()` and server-only API handlers. Public website and mobile product rendering call Next.js APIs instead of connecting directly to Supabase tables.

Critical Prisma access paths:

| Domain | Runtime Evidence |
| --- | --- |
| Public menu | `apps/web/lib/server/publicMenu.ts` uses `db.catalogProduct.findMany()` with category/images. |
| Auth | `apps/web/lib/server/auth/prismaRepository.ts` uses `user`, `role`, `session`. |
| Control Tower products/media/orders/logs | API routes under `apps/web/app/api/control-tower/*` use Prisma. |
| WhatsApp | `packages/backend/src/integrations/whatsapp/whatsapp.repository.ts` writes webhook events/logs. |
| Runtime governance | `runtimeConfiguration`, `featureFlag`, `activityLog`, `auditLog` are server-managed. |

## Compatibility Decision

| Area | Compatibility | Reason |
| --- | --- | --- |
| Prisma schema | COMPATIBLE | RLS SQL does not alter columns, relations, enums, indexes, or table names. |
| Generated Prisma client | COMPATIBLE | No Prisma model shape changes are introduced. |
| Server-side reads | EXPECTED COMPATIBLE | Initial RLS plan does not use `FORCE ROW LEVEL SECURITY`; owner/service credentials should bypass RLS. |
| Server-side writes | EXPECTED COMPATIBLE | Prisma server runtime remains the write authority if it uses owner/service credentials. |
| Direct Supabase anon access | RESTRICTED BY DESIGN | Public direct reads only for active catalog-safe content. |
| Direct Supabase authenticated access | RESTRICTED BY DESIGN | Owner/staff/admin policies require Supabase JWT role claims. |

## Required Pre-Apply Checks

Before applying in staging:

1. Confirm `DATABASE_URL` user is owner/service-like and not plain `anon` or low-privilege `authenticated`.
2. Confirm no frontend code uses Supabase direct table queries.
3. Confirm Supabase JWT role claims if direct authenticated table access is expected.
4. Run all SALORA validation gates after staging apply.
5. Smoke test:
   - `/api/products`
   - `/api/auth/login`
   - `/api/auth/refresh`
   - `/control-tower`
   - `/api/control-tower/simple-launch/products`
   - `/api/control-tower/media`
   - WhatsApp webhook ingestion in staging.

## Known Risk

If Prisma is connected through a role affected by RLS and no service/owner bypass is available, writes and reads may fail until database JWT claims or service-role policies are aligned.

## Recommendation

Apply the migration only in staging first. Do not enable `FORCE ROW LEVEL SECURITY` in the initial phase.
