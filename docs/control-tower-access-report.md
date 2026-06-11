# Control Tower Access Report

## Summary

- Control Tower is implemented inside the existing Next.js web app, not as a separate `apps/control-tower` app.
- This report is evidence-based from the current SALORA project files.
- No application code was modified.

## Control Tower Page Entry Point

- Page entry point: `ControlTowerPage`
- File: `apps/web/app/(control-tower)/control-tower/page.tsx`
- Evidence: the page imports `ControlTowerShell` and `ControlTowerView`, exports `dynamic = "force-dynamic"`, and renders `<ControlTowerView sectionId="executive" />`.

## Route Path

- Main route path: `/control-tower`
- Section route path: `/control-tower/[section]`
- Evidence:
  - `apps/web/app/(control-tower)/control-tower/page.tsx`
  - `apps/web/app/(control-tower)/control-tower/[section]/page.tsx`
  - `apps/web/components/control-tower/ControlTowerShell.tsx` links each section to `/control-tower/${section.id}`.

## Next.js Page Files

- Main page: `apps/web/app/(control-tower)/control-tower/page.tsx`
- Dynamic section page: `apps/web/app/(control-tower)/control-tower/[section]/page.tsx`
- Section registry: `apps/web/lib/control-tower/registry.ts`

Valid section IDs from `apps/web/lib/control-tower/registry.ts`:

- `executive`
- `revenue`
- `orders`
- `inventory`
- `customers`
- `loyalty`
- `ai`
- `whatsapp`
- `instagram`
- `notifications`
- `content`
- `automation`
- `integrations`
- `settings`

## Authentication Requirements

- No page-level auth guard was found for `/control-tower` or `/control-tower/[section]`.
- Control Tower browser API calls use `getDashboardAccessToken()` from `apps/web/lib/dashboard/client.ts`.
- `getDashboardAccessToken()` reads these localStorage keys:
  - `salora_access_token`
  - `salora.accessToken`
  - `accessToken`
- Control Tower API endpoints pass the token as `Authorization: Bearer <token>`.
- API reads require `catalog:read`.
- API writes require `catalog:write`.

Role permission evidence from `apps/web/lib/server/auth/rbac.ts`:

- `STAFF`: includes `catalog:read`
- `MANAGER`: includes `catalog:read` and `catalog:write`
- `ADMIN`: includes `catalog:*`

Endpoint evidence:

- `apps/web/app/api/control-tower/simple-launch/products/route.ts`
  - `GET` calls `requireControlPermission(request, "catalog:read")`
  - mutations call `requireControlPermission(request, "catalog:write")`
- `apps/web/app/api/control-tower/simple-launch/product-images/route.ts`
  - `GET` calls `requireControlPermission(request, "catalog:read")`
  - mutations call `requireControlPermission(request, "catalog:write")`
- `apps/web/app/api/control-tower/media/route.ts`
  - `GET` calls `requireControlPermission(request, "catalog:read")`
  - mutations call `requireControlPermission(request, "catalog:write")`
- `apps/web/app/api/control-tower/ai-studio/route.ts`
  - `POST` calls `requireControlPermission(request, "catalog:write")`
- `apps/web/app/api/control-tower/simple-launch/ai-product-tools/route.ts`
  - `POST` calls `requireControlPermission(request, "catalog:write")`
- `apps/web/app/api/control-tower/simple-launch/promotions/route.ts`
  - `GET` calls `requireControlPermission(request, "catalog:read")`
  - mutations call `requireControlPermission(request, "catalog:write")`

## Default Local URL

- Default local Control Tower URL: `http://localhost:3000/control-tower`

Evidence:

- Root `package.json` defines `dev:web` as `pnpm --filter @salora/web dev`.
- `apps/web/package.json` defines `dev` as `next dev`.
- `.env.example` defines `BASE_URL=http://localhost:3000`.

## Production URL If Configured

- Production Control Tower URL: `https://salora.cafe/control-tower`

Evidence:

- `.env.example` defines `NEXT_PUBLIC_SALORA_SITE_URL=https://salora.cafe`.
- `packages/config/src/index.ts` falls back to `https://salora.cafe` for `saloraRuntime.siteUrl`.
- `apps/web/app/sitemap.ts` falls back to `https://salora.cafe`.
- `apps/web/app/robots.ts` falls back to `https://salora.cafe`.
- No checked-in `vercel.json` was found.

## Exact Browser URLs To Open

Local:

- Products: `http://localhost:3000/control-tower/content`
- Product Media: `http://localhost:3000/control-tower/content`
- AI Studio: `http://localhost:3000/control-tower/ai`
- Promotions: `http://localhost:3000/control-tower/revenue`

Production:

- Products: `https://salora.cafe/control-tower/content`
- Product Media: `https://salora.cafe/control-tower/content`
- AI Studio: `https://salora.cafe/control-tower/ai`
- Promotions: `https://salora.cafe/control-tower/revenue`

## Notes

- Products and Product Media both live under the `content` Control Tower section in the current UI.
- Product and promotion API data/actions require an authorized token even though the page route itself has no page-level guard.
