# Enterprise Admin Bootstrap Security

Date: 2026-06-05
Workspace: `C:\dev\salora-platform`

## Objective

Provide secure first-admin provisioning without hardcoded credentials or demo users.

## Changes Applied

- Added `scripts/bootstrap-admin.mjs`.
- Added root script `bootstrap:admin`.
- Bootstrap uses environment variables only.
- Password hashing uses the shared Argon2id `hashPassword()` implementation.
- Bootstrap writes through Prisma.
- Bootstrap creates/updates AuditLog and ActivityLog records.
- Bootstrap stores a password-rotation requirement in `RuntimeConfiguration`.

## Required Environment

- `SALORA_ADMIN_BOOTSTRAP_ENABLED=true`
- `SALORA_ADMIN_BOOTSTRAP_EMAIL`
- `SALORA_ADMIN_BOOTSTRAP_NAME`
- `SALORA_ADMIN_BOOTSTRAP_PASSWORD`
- `DATABASE_URL`

## Security Controls

- No credentials are hardcoded.
- No default admin account is created.
- Password must be at least 16 characters.
- Password is stored hashed only.
- Role assignment is limited to `ADMIN` for the requested environment-controlled bootstrap user.
- Bootstrap emits a unique `requestId`.
- Bootstrap writes `ActivityLog` action `admin.bootstrap`.
- Bootstrap writes `AuditLog` for the user create/update event.
- Bootstrap records password rotation required under `RuntimeConfiguration` scope `APP`.

## Execution

Command:

```powershell
pnpm bootstrap:admin
```

## Validation

The script was added and typechecked through the workspace. It was not executed against the live database in this session because doing so would create or update a real administrator.

## Residual Risk

The application still needs an enforced password-rotation UX before this becomes a complete operator lifecycle.
