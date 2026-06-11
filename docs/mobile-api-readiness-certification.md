# Mobile API Readiness Certification

Date: 2026-06-06
Workspace: `C:\dev\salora-platform`

## Evidence

- Mobile API base URL defaults to `https://salora.cafe`.
- `EXPO_PUBLIC_API_URL` can override the mobile API base URL.
- Mobile product menu calls `/api/products`.
- Mobile supports both legacy product array responses and the new `{ data, runtime }` response shape.
- Mobile displays `Menu data is in fallback mode.` when fallback mode is active.
- Mobile typecheck passed through `pnpm typecheck` and `pnpm test`.

## Limitations

No mobile release build was run.

No live mobile HTTP call was certified because the local web dev server could not be kept running in the background environment.

## Final Status

`MOBILE_API_PARTIAL`
