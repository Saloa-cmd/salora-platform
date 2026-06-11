# P0 Admin Auth Certification

Date: 2026-06-07

## Scope

P0-1 Production Admin Authentication.

Audited:

- `apps/web/lib/server/auth/runtime.ts`
- `apps/web/lib/server/auth/service.ts`
- `apps/web/lib/server/auth/prismaRepository.ts`
- `apps/web/lib/server/auth/cookies.ts`
- `apps/web/lib/server/auth/rbac.ts`
- `apps/web/lib/server/auth/controlTower.ts`
- `apps/web/app/api/auth/login/route.ts`
- `apps/web/app/api/auth/refresh/route.ts`
- `apps/web/app/api/auth/logout/route.ts`
- `apps/web/app/api/auth/me/route.ts`

## Changes

- Production auth runtime now constructs `PrismaAuthRepository(getPrismaClient())`.
- `MemoryAuthRepository` is now limited to non-production runtime only.
- Production no longer throws `AuthRepositoryUnavailableError` for the configured database-backed auth path.
- `PrismaAuthRepository` typing was loosened at the internal client boundary so the real generated Prisma client can be injected without changing database architecture.

## Certification Matrix

| Requirement | Result | Evidence |
| --- | --- | --- |
| Production uses PrismaAuthRepository | PASS IN CODE | `runtime.ts` selects `PrismaAuthRepository` when `NODE_ENV === "production"`. |
| MemoryAuthRepository only local development | PASS IN CODE | `runtime.ts` returns memory repository only when `NODE_ENV !== "production"`. |
| Login | PASS IN CODE | `/api/auth/login` calls `getAuthService().login()` and applies auth cookies. |
| Logout | PASS IN CODE | `/api/auth/logout` revokes the refresh session and clears auth cookies. |
| Refresh | PASS IN CODE | `/api/auth/refresh` accepts body or cookie refresh token, rotates session, reapplies cookies. |
| Session persistence | PASS IN CODE | `AuthService.issueTokens()` persists refresh sessions through repository `createSession()`. |
| Cookie persistence | PASS IN CODE | `applyAuthCookies()` writes HTTP-only access and refresh cookies with production `secure` flag. |
| RBAC verification | PASS IN CODE | Control Tower page guard uses access cookie, verifies JWT, and checks `STAFF`, `MANAGER`, `ADMIN`. |

## Runtime Limitation

The local `.env` and `.env.local` key inventory does not include `JWT_SECRET` or `JWT_REFRESH_SECRET`. Because `getAuthEnv()` requires both in production, the production auth path is code-ready but the current local environment is not fully credential-ready for a live login/refresh/logout transaction.

No secret values were printed or copied.

## Status

AUTH_CODE_FIXED

AUTH_LIVE_SECRET_CONFIGURATION_REQUIRED
