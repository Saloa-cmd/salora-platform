# Registration Security Remediation

Date: 2026-06-05
Workspace: `C:\dev\salora-platform`

## Objective

Public registration must create `CUSTOMER` users only. Requested `ADMIN`, `MANAGER`, or `STAFF` roles must be ignored.

## Changes Applied

- Removed `roles` from the public registration schema in `apps/web/lib/server/auth/http.ts`.
- Added explicit `publicRegistrationRoles()` in `apps/web/lib/server/auth/registration.ts`.
- Updated `AuthService.register()` in `apps/web/lib/server/auth/service.ts` to always use `publicRegistrationRoles()`.
- Added automated assertions to `scripts/auth-foundation.test.mjs`.
- Migrated new password hashes to Argon2id in `apps/web/lib/server/auth/crypto.ts`.
- Kept legacy scrypt verification for existing hashes.

## Evidence

- `registerSchema` no longer declares a `roles` field.
- `AuthService.register()` assigns `["CUSTOMER"]` through `publicRegistrationRoles()`.
- `scripts/auth-foundation.test.mjs` verifies:
  - new password hashes start with Argon2 format
  - public registration schema does not accept roles
  - public registration role policy returns `CUSTOMER` only

## Validation

- `node --experimental-strip-types scripts/auth-foundation.test.mjs`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm lint`: PASS.

## Residual Risk

This remediates public registration role self-assignment. It does not yet add a full admin invite workflow.
