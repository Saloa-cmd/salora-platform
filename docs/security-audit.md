# SALORA Security Audit

Date: 2026-06-05
Workspace audited: `C:\dev\salora-platform`

## Evidence Base

- Auth HTTP helper: `apps/web/lib/server/auth/http.ts`.
- Auth service: `apps/web/lib/server/auth/service.ts`.
- Auth runtime: `apps/web/lib/server/auth/runtime.ts`.
- RBAC map: `apps/web/lib/server/auth/rbac.ts`.
- Control Tower client token storage: `apps/web/lib/control-tower/client.ts`.
- Middleware/proxy headers and rate limit: `apps/web/proxy.ts`.

## Confirmed Findings

| Severity | Area | Finding | Evidence |
|---:|---|---|---|
| HIGH | Registration RBAC | Registration schema accepts optional `roles`; auth service persists requested roles when provided. | `registerSchema.roles` in `auth/http.ts`; `AuthService.register` uses `input.roles?.length ? input.roles : ["CUSTOMER"]`. |
| HIGH | Auth persistence | Non-production can use memory auth; production path throws repository unavailable when PostgreSQL auth repository is not configured. | `auth/runtime.ts` behavior observed in code. |
| MEDIUM | Control Tower access | Page files have no page-level auth guard; API calls rely on bearer token authorization. | Control Tower page files render UI directly; client sends localStorage bearer token. |
| MEDIUM | Missing token handling | Shared helper throws `Missing bearer token.`; Control Tower simple-launch error mapping does not explicitly convert it to 401. | `currentAuthPayload` and simple-launch error handler. |
| MEDIUM | Token storage | Browser client reads tokens from localStorage keys. | `apps/web/lib/control-tower/client.ts`. |
| MEDIUM | CSP | CSP allows `unsafe-inline` for script and style. | `apps/web/proxy.ts`. |
| MEDIUM | Rate limiting | Rate limiter is process-local memory. | `apps/web/proxy.ts`. |
| LOW | Runtime diagnostics | Diagnostics routes are token-protected in production but open in non-production if no token configured. | Runtime route behavior and diagnostics helper. |

## RBAC Reality

- `CUSTOMER`: self order read/create.
- `STAFF`: order read/update and catalog read.
- `MANAGER`: order read/update, catalog read/write, staff read.
- `ADMIN`: order/catalog/staff/user/system wildcards.

## Control Tower Permission Reality

- Product/catalog reads require `catalog:read`.
- Product/catalog writes require `catalog:write`.
- Runtime config write surface can require `system:write`.
- UI access itself is not blocked at the page route.

## Secrets and Logs

- No broad plaintext secret dump is included in this report.
- Payment security code includes secret redaction patterns.
- Runtime logs should still be reviewed before production because some service modules use direct console logging.

## Required Remediation

- Remove role self-assignment from registration payload or restrict it to an admin-only invite flow.
- Add page-level authorization for `/control-tower`.
- Map missing bearer token to 401 consistently.
- Move Control Tower auth away from localStorage tokens where feasible.
- Replace process-local rate limit with a shared production limiter if deployed horizontally/serverless.
