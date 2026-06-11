# Soft Launch Recheck Validation

Date: 2026-06-06
Workspace: `C:\dev\salora-platform`

## Validation Gates

| Gate | Result | Evidence |
|---|---:|---|
| `prisma validate` | PASS | Schema valid. |
| `prisma generate` | PASS | Prisma Client 7.8.0 generated to `packages/backend/src/database/generated` in 2.57s. |
| `prisma migrate status` | UNKNOWN | Supabase host was identified, then Prisma returned `Schema engine error`. |
| `pnpm lint` | PASS | ESLint completed with exit 0 after rerun with longer timeout. |
| `pnpm typecheck` | PASS | Web and mobile TypeScript checks completed. |
| `pnpm test` | PASS | Full script suite completed. |
| `pnpm build` | PASS | Direct web build completed with exit 0. |

## Build Evidence

Direct web build command:

```powershell
C:\dev\.tools\node-v22.22.3-win-x64\corepack.cmd pnpm --filter @salora/web build
```

Build result:

- Next.js 16.2.6.
- Compiled successfully in 3.1 minutes.
- TypeScript completed in 93 seconds.
- Generated 34 static pages.
- Route table includes `/control-tower` and `/control-tower/[section]`.

## Warnings

- Nested pnpm reports Node `v24.15.0` despite root engine `>=22 <23`.
- Direct TypeScript script tests still report `MODULE_TYPELESS_PACKAGE_JSON`.
- Root `pnpm build` timed out once, but direct web build passed and produced a complete route table.
