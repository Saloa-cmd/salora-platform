# SALORA Auth Activation Package

Date: 2026-06-08

Scope:

- `docs/control-tower-auth-activation.md`
- Auth runtime requirements
- JWT secret requirements
- Cookie/session requirements
- Admin bootstrap requirements

No `.env` value was changed. No login was executed. No session was created.

## Decision

AUTH_READY_FOR_STAGING

The activation package is complete for staging. Actual staging activation requires approved secret insertion before running login/session tests.

## Required Environment

| Variable | Requirement | Current Local Evidence |
| --- | --- | --- |
| `DATABASE_URL` | Required, valid PostgreSQL URL | Present |
| `JWT_SECRET` | Required, at least 32 characters, high entropy | Missing locally |
| `JWT_REFRESH_SECRET` | Required, at least 32 characters, high entropy, different from access secret | Missing locally |
| `AUTH_ACCESS_TTL_SECONDS` | Optional, positive integer, default 900 | Missing locally, default applies |
| `AUTH_REFRESH_TTL_DAYS` | Optional, positive integer, default 30 | Missing locally, default applies |

## Secret Generation Requirements

Generate secrets outside source control using a cryptographically secure generator.

Minimum requirement:

- 32+ bytes entropy.
- Different values for access and refresh secrets.
- Stored only in approved environment secret manager or explicitly approved `.env` target.
- Never committed.
- Rotate if exposed in terminal, logs, screenshots, or docs.

Example generation pattern for operator use:

```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```

## Cookie Requirements

Current implementation:

- `salora_access_token`
- `salora_refresh_token`
- `httpOnly: true`
- `sameSite: "lax"`
- `secure: true` in production
- `path: "/"`

Staging validation must prove:

- Cookies are set on login.
- Cookies persist across refresh.
- Logout clears both cookies.
- Control Tower page guard accepts valid access token cookie.
- Unauthorized users are redirected or denied.

## Session Persistence Requirements

Staging validation must prove:

- Login creates a `sessions` row.
- Refresh revokes old session and creates/uses a new active refresh flow.
- Logout revokes the refresh session.
- Expired/revoked sessions cannot refresh.

## Admin Bootstrap Requirements

Current local evidence shows bootstrap variable names are present:

- `SALORA_ADMIN_BOOTSTRAP_ENABLED`
- `SALORA_ADMIN_BOOTSTRAP_EMAIL`
- `SALORA_ADMIN_BOOTSTRAP_PASSWORD`

Before bootstrap:

1. Confirm no approved admin already exists.
2. Confirm bootstrap target database is staging, not production.
3. Confirm password meets script requirement: at least 16 characters.
4. Run bootstrap once.
5. Rotate bootstrap password after first login.
6. Disable bootstrap after completion.

## Staging Auth Test Checklist

| Test | Pass Criteria |
| --- | --- |
| Production env parse | `getAuthEnv()` succeeds with approved secrets |
| Admin login | Access and refresh cookies set; user has ADMIN role |
| Manager login | Manager can access allowed catalog/order operations |
| Staff login | Staff can access staff operations and is denied manager/admin writes |
| Unauthorized access | `/control-tower` denied without valid token |
| API guard | Bearer token required for Control Tower APIs |
| Refresh | Old refresh session revoked, new auth result issued |
| Logout | Refresh session revoked and cookies cleared |

