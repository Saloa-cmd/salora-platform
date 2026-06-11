# SALORA Prisma Root Cause Analysis

Date: 2026-06-08

Scope: `prisma generate`, `prisma migrate status`, Next build EPERM, Node/pnpm version, generated directory permissions, Supabase connectivity.

No migration was applied. `prisma generate` was run to validate the root cause; it regenerated local Prisma client files only and did not modify database data.

## Decision

PRISMA_FIX_READY

## Root Cause Summary

There are two distinct Prisma/runtime issues:

1. `EPERM` during `prisma generate` and `.next\trace` build writes was caused by sandbox filesystem restrictions, not by file ownership, read-only attributes, antivirus proof, or a Windows file lock.
2. `prisma migrate status` schema-engine failure was caused by running inside the restricted environment. Outside sandbox restrictions, the schema engine works and reports the real migration state: `20260608_security_hardening` is pending.

## Evidence

| Check | Result |
| --- | --- |
| `browser.ts`, `client.ts`, `.next\trace` attributes | `IsReadOnly=False`, owner `7DAYS-PC\7DAYS`, Modify ACL present |
| Exclusive open inside sandbox | Failed with `Access to the path ... is denied` |
| Exclusive open outside sandbox | Succeeded for `browser.ts`, `client.ts`, and `.next\trace` |
| `prisma generate` inside sandbox | Failed with `EPERM: operation not permitted, unlink ... generated\browser.ts` |
| `prisma generate` outside sandbox | Succeeded: generated Prisma Client 7.8.0 in 2.83s |
| `pnpm build` inside sandbox | Failed with `EPERM ... apps\web\.next\trace` |
| `pnpm build` outside sandbox | Succeeded; Next.js generated 34 static pages |
| `migrate status` inside sandbox | `Schema engine error` |
| `migrate status` outside sandbox | Schema engine worked; reported pending `20260608_security_hardening` migration |

## Exact File

Files affected by sandbox-denied writes:

- `C:\dev\salora-platform\packages\backend\src\database\generated\browser.ts`
- `C:\dev\salora-platform\packages\backend\src\database\generated\client.ts`
- `C:\dev\salora-platform\apps\web\.next\trace`

## Exact Process

The failing process is the sandboxed command runner executing Prisma/Next writes in `C:\dev\salora-platform`. It is not an identified external lock holder. Outside sandbox restrictions, the same file exclusive-open tests and commands succeed.

Read-only process inspection showed Node processes:

- `node.exe ./mcp/server.mjs`
- Codex node processes with `--experimental-vm-modules`

No process-level file lock was proven. The validated cause is sandbox write denial.

## Node Version Finding

`pnpm.cmd` resolves through global Node:

- Current pnpm command reports Node `v24.15.0`.
- Root `package.json` requires Node `>=22 <23`.
- Bundled Node `C:\dev\.tools\node-v22.22.3-win-x64\node.exe` exists and reports Node `v22.22.3`.

This did not cause the EPERM failures, but it remains a runtime consistency issue.

## Supabase Connectivity Finding

Supabase is reachable for read-only Prisma queries outside sandbox restrictions. `migrate status` reaches the database and reports:

```text
10 migrations found in prisma/migrations
Following migration have not yet been applied:
20260608_security_hardening
```

## Exact Fix

1. Run Prisma/Next validation outside the filesystem sandbox, or move the workspace under a writable sandbox root.
2. Use Node 22 consistently for pnpm commands.
3. Treat `20260608_security_hardening` as pending, not failed.
4. Do not apply the pending migration until RLS design remediation is complete and human approval is granted.

