# SALORA Control Tower Auth Activation Root Cause

Date: 2026-06-08

Scope: auth env, auth runtime, login/refresh/logout routes, cookies, session persistence, admin bootstrap.

No login was executed. No session was created. No admin bootstrap was executed. No `.env` value was changed.

## Decision

AUTH_FIX_READY

## Root Cause

Live production-mode Control Tower login is blocked locally by missing JWT signing secrets:

- `JWT_SECRET` is absent.
- `JWT_REFRESH_SECRET` is absent.

Evidence from production auth env parse:

```json
{
  "ok": false,
  "message": "SALORA auth environment is invalid: JWT_SECRET: Invalid input: expected string, received undefined; JWT_REFRESH_SECRET: Invalid input: expected string, received undefined"
}
```

## Configuration Evidence

| Key | Present |
| --- | --- |
| `DATABASE_URL` | Yes |
| `DIRECT_URL` | Yes |
| `JWT_SECRET` | No |
| `JWT_REFRESH_SECRET` | No |
| `AUTH_ACCESS_TTL_SECONDS` | No, default exists in schema |
| `AUTH_REFRESH_TTL_DAYS` | No, default exists in schema |
| `SALORA_ADMIN_BOOTSTRAP_ENABLED` | Yes |
| `SALORA_ADMIN_BOOTSTRAP_EMAIL` | Yes |
| `SALORA_ADMIN_BOOTSTRAP_PASSWORD` | Yes |

## Runtime Evidence

| Component | Evidence | Status |
| --- | --- | --- |
| Production repository | `runtime.ts` selects `PrismaAuthRepository(getPrismaClient())` when `NODE_ENV === "production"` | Correct |
| Development repository | `runtime.ts` selects `MemoryAuthRepository` outside production | Correct |
| Login | `/api/auth/login` calls `getAuthService().login()` and applies cookies | Correct |
| Refresh | `/api/auth/refresh` rotates refresh session and applies cookies | Correct |
| Logout | `/api/auth/logout` revokes session and clears cookies | Correct |
| Cookies | HTTP-only, `sameSite=lax`, secure in production | Correct |
| RBAC | CUSTOMER/STAFF/MANAGER/ADMIN permissions exist | Correct |
| Page guard | Control Tower reads `salora_access_token` HTTP-only cookie | Correct |
| API guard | API auth requires bearer token | Needs live flow test |

## Exact Fix

1. Obtain explicit approval to set secrets in the target staging/production environment.
2. Add strong values for:
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
3. Confirm `NODE_ENV=production` auth env parses successfully.
4. Run admin bootstrap only if the target database has no approved admin, using existing `scripts/bootstrap-admin.mjs`.
5. Execute live auth activation tests:
   - admin login
   - manager login
   - staff login
   - unauthorized `/control-tower` denial
   - refresh token rotation
   - logout revocation
   - page cookie guard
   - API bearer guard

## Remaining Risk

Login and refresh write `sessions` rows. They cannot be fully validated under a no-write rule.

