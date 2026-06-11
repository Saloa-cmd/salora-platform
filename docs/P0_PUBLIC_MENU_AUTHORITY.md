# P0 Public Menu Authority

Date: 2026-06-07

## Scope

P0-4 Public Menu Authority.

Audited:

- `apps/web/lib/server/publicMenu.ts`
- `apps/web/app/api/products/route.ts`
- `apps/web/app/api/ready/route.ts`
- `apps/web/app/page.tsx`

## Findings

`getPublicMenuSnapshot()` already returns explicit runtime metadata:

- `source: "database" | "fallback"`
- `stale: boolean`
- `runtimeMode: "live" | "fallback"`
- `databaseHealth: "available" | "unavailable"`

`/api/products` already exposes the same truth in JSON and response headers:

- `x-salora-data-source`
- `x-salora-stale`
- `x-salora-database-health`

The public website already renders a visible fallback warning when stale mode is active.

## Change

`/api/ready` now fails readiness when public menu data is stale or not database-backed.

Added readiness check:

- `catalogLive: menuSnapshot.source === "database" && !menuSnapshot.stale`

Readiness now requires:

- catalog loaded
- catalog live
- site URL configured
- WhatsApp number configured
- infrastructure not critical

## Certification Matrix

| Requirement | Result | Evidence |
| --- | --- | --- |
| Fallback visible | PASS | Public page and product API expose fallback/stale status. |
| Stale mode visible | PASS | Runtime JSON, headers, and public warning expose stale mode. |
| Launch readiness fails when stale | PASS | `/api/ready` now requires `catalogLive`. |
| No hidden fallback | PASS | Fallback data remains marked as fallback/stale. |

## Status

PUBLIC_MENU_AUTHORITY_FIXED
