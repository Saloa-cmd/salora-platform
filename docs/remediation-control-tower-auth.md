# Control Tower Authentication Remediation

Date: 2026-06-05
Workspace: `C:\dev\salora-platform`

## Objective

Protect `/control-tower` and `/control-tower/[section]` with server-side page authorization.

## Changes Applied

- Added `apps/web/lib/server/auth/cookies.ts`.
- Added `apps/web/lib/server/auth/controlTowerAccess.ts`.
- Added `apps/web/lib/server/auth/controlTower.ts`.
- Updated auth login/register/refresh routes to set HTTP-only auth cookies.
- Updated logout route to clear auth cookies.
- Updated Control Tower page files to call `requireControlTowerPageAccess()`.
- Updated Control Tower API error handling to map missing bearer tokens to 401.

## Authorization Policy

Allowed Control Tower roles:

- `STAFF`
- `MANAGER`
- `ADMIN`

Denied:

- `CUSTOMER`
- missing session
- invalid/expired token

## Evidence

- `/control-tower` page imports and awaits `requireControlTowerPageAccess()`.
- `/control-tower/[section]` page imports and awaits `requireControlTowerPageAccess()`.
- `requireControlTowerPageAccess()` reads the HTTP-only `salora_access_token` cookie, verifies the JWT server-side, and checks allowed roles.
- Existing bearer-token API clients remain backward compatible.

## Redirect Behavior

- Unauthenticated users redirect to `/dashboard?auth=required`.
- Authenticated users without allowed roles redirect to `/dashboard?access=denied`.

## Validation

- `scripts/auth-foundation.test.mjs` verifies Control Tower role access logic.
- `pnpm build` verified `/control-tower` and `/control-tower/[section]` remain dynamic routes.

## Residual Risk

The redirect target is the existing dashboard route. A richer access-denied page was not added to avoid creating a parallel admin surface.
