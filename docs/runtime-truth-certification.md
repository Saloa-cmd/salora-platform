# Runtime Truth Certification

Date: 2026-06-05
Workspace: `C:\dev\salora-platform`

## Objective

Fallback paths must not be silent. Runtime mode, provider mode, stale state, and database health must be visible.

## Changes Applied

- Added `getPublicMenuSnapshot()` in `apps/web/lib/server/publicMenu.ts`.
- `/api/products` now returns runtime metadata and headers:
  - `runtime.source`
  - `runtime.stale`
  - `runtime.mode`
  - `runtime.databaseHealth`
  - `x-salora-data-source`
  - `x-salora-stale`
  - `x-salora-database-health`
- Home page shows a visible banner when menu data is in fallback mode.
- `/api/ready` includes catalog source, stale state, and database menu health.
- Mobile menu accepts both legacy array and new `{ data, runtime }` API shape.
- Mobile menu shows fallback mode text when fallback data is active.

## Runtime Findings

| Target | Status | Evidence |
|---|---:|---|
| `packages/data` fallback | VISIBLE/PARTIAL | Website and products API now expose fallback mode. Static package remains active fallback. |
| Website fallback data | VISIBLE | Home page banner and API runtime metadata. |
| Mobile fallback data | VISIBLE | Menu screen displays fallback mode. |
| AI fallback provider | PARTIAL | AI gateway has mock fallback; provider mode is documented but not fully surfaced in all UI. |
| WhatsApp fallback handlers | PARTIAL | Provider readiness route masks missing keys; duplicate webhook ownership remains. |
| Database health | VISIBLE/PARTIAL | `/api/ready` and runtime governance expose DB status; live migration status remains unverified. |

## Residual Risk

AI and WhatsApp fallback modes require deeper operator-facing status in Control Tower before final launch readiness.
