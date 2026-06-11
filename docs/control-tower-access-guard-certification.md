# Control Tower Access Guard Certification

Date: 2026-06-06
Workspace: `C:\dev\salora-platform`

## Code Evidence

- `/control-tower` calls `requireControlTowerPageAccess()`.
- `/control-tower/[section]` calls `requireControlTowerPageAccess()`.
- `requireControlTowerPageAccess()` reads the HTTP-only `salora_access_token` cookie.
- The access token is verified server-side through `getAuthService().verifyAccessToken()`.
- Allowed roles are `STAFF`, `MANAGER`, `ADMIN`.
- `CUSTOMER` is not in the allowed role list.
- Missing auth redirects to `/dashboard?auth=required`.
- Unauthorized role redirects to `/dashboard?access=denied`.
- Control Tower API missing bearer token maps to `401 Unauthorized`.

## Runtime Matrix

| Scenario | Result | Evidence |
|---|---:|---|
| Unauthenticated access | NOT RUNTIME-CERTIFIED | Dev server background smoke was blocked by Next lockfile IO. Code redirects unauthenticated users. |
| Invalid token access | NOT RUNTIME-CERTIFIED | Requires running server and request injection; not completed. |
| CUSTOMER access | NOT RUNTIME-CERTIFIED | No real CUSTOMER login credential was available. Code denies CUSTOMER. |
| STAFF access | NOT RUNTIME-CERTIFIED | No real STAFF login credential was available. Code allows STAFF. |
| MANAGER access | NOT RUNTIME-CERTIFIED | No real MANAGER login credential was available. Code allows MANAGER. |
| ADMIN access | BLOCKED | Admin bootstrap env vars missing, so no real ADMIN login cookie could be produced. |

## Final Status

`CONTROL_TOWER_AUTH_PARTIAL`
