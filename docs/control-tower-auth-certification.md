# SALORA Control Tower Auth Certification v3.0

Date: 2026-06-08

Scope:

- `apps/web/lib/server/auth/*`
- `apps/web/app/api/auth/*`
- Control Tower page/API guards
- RBAC
- Cookie/session behavior
- Admin bootstrap readiness

No login was performed because login would create/update a session record. No admin bootstrap was executed.

## Decision

AUTH_PARTIAL

## Executive Finding

The Control Tower authentication architecture is present and materially improved, but it is not fully certifiable under the current no-production-data-write rule. A live admin/manager/staff login test would create session state, and the local production auth environment is missing `JWT_SECRET` and `JWT_REFRESH_SECRET`.

## Evidence

| Requirement | Evidence | Result |
| --- | --- | --- |
| Production uses Prisma repository | `runtime.ts` uses `PrismaAuthRepository(getPrismaClient())` when `NODE_ENV === "production"` | PASS in code |
| Memory repository local only | `runtime.ts` uses `MemoryAuthRepository` when not production | PASS in code |
| Login route | `/api/auth/login` calls `getAuthService().login()` and applies cookies | PASS in code |
| Logout route | `/api/auth/logout` revokes refresh session and clears cookies | PASS in code |
| Refresh route | `/api/auth/refresh` verifies refresh token, rotates session, reapplies cookies | PASS in code |
| Session persistence | `PrismaAuthRepository.createSession()` writes `sessions` table | PASS in code, not live-tested |
| Cookie persistence | Cookies are HTTP-only, `sameSite=lax`, path `/`, secure in production | PASS in code |
| RBAC | `rbac.ts` defines CUSTOMER/STAFF/MANAGER/ADMIN capabilities | PASS in code |
| Control Tower page guard | `requireControlTowerPageAccess()` reads HTTP-only `salora_access_token` cookie | PASS in code |
| API guard | `currentAuthPayload()` requires bearer token from `Authorization` header | PASS in code |
| Auth tests | `pnpm test` reports `Auth foundation tests passed` | PASS in tests |
| Admin bootstrap env names | Bootstrap email/password/enabled keys exist by name | PARTIAL |
| Production JWT env names | `JWT_SECRET` and `JWT_REFRESH_SECRET` absent from local env files | BLOCKER for local production auth certification |
| Live admin login | Not executed because it would write session data | BLOCKED by governance |
| Manager/staff login | Not executed | BLOCKED by governance |
| Unauthorized access denial | Code guard exists; live browser auth session unavailable | PARTIAL |

## Risks

| Risk | Severity | Impact | Required Action |
| --- | --- | --- | --- |
| Missing local production JWT secrets | Critical | `getAuthEnv()` will reject production auth runtime locally | Configure approved secrets in target environment, with explicit approval |
| Page cookie/API bearer split | High | Page access may pass via cookie while Control Tower client API needs bearer token storage | Verify login stores/supplies bearer for Control Tower client calls |
| No live session test | High | Cannot certify session persistence, refresh rotation, cookie survival, redirects, or RBAC behavior | Run staging login tests after approval to write session rows |
| RLS inactive | High | Auth is app-layer only until DB policies are staged | Complete RLS remediation |

## Required Certification Tests After Approval

1. Admin login with real approved admin account.
2. Manager login and catalog/order permission verification.
3. Staff login and restricted write denial.
4. Customer/unauthorized access denial to `/control-tower`.
5. Cookie persistence across refresh.
6. Logout revokes refresh session and clears cookies.
7. API bearer authorization matches page-level session behavior.
8. Audit/activity log entries are created for privileged mutations.

