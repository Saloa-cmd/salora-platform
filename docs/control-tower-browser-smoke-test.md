# Control Tower Browser Smoke Test

Date: 2026-06-06
Workspace: `C:\dev\salora-platform`

## Dev Server Command

Known working foreground command:

```powershell
C:\dev\.tools\node-v22.22.3-win-x64\corepack.cmd pnpm --filter @salora/web dev
```

Evidence:

- Foreground run reached `Next.js 16.2.6`.
- Local URL reported: `http://localhost:3000`.
- Server reached `Ready in 28.9s` during one run.

## Background Smoke Attempt

Background/job based smoke test was blocked:

- Next reached `Ready in 3.2s`.
- Then exited with `Error: An IO error occurred while attempting to create and acquire the lockfile`.
- Cause reported: `Access is denied. (os error 5)`.

## Routes Requested

The automated HTTP route checks could not connect while the job-based server was alive:

- `/control-tower`
- `/api/products`

Authorized section smoke was not possible because admin login is blocked by missing bootstrap env vars.

## Final Status

`CONTROL_TOWER_BROWSER_BLOCKED`
