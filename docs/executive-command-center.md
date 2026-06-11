# SALORA Executive Command Center

The Executive Command Center is a read-only, API-bound dashboard system built from the DEV blueprint without copying simulator-heavy DEV code.

## Routes

- `/dashboard`
- `/dashboard/revenue`
- `/dashboard/operations`
- `/dashboard/ai`
- `/dashboard/customers`
- `/dashboard/whatsapp`

## Architecture

- Route ownership: `apps/web/app/(dashboard)/dashboard/**`
- Component ownership: `apps/web/components/dashboard/**`
- Data ownership: `apps/web/lib/dashboard/**`
- API ownership: existing SALORA intelligence and health routes.

## Security

Dashboard adapters call RBAC-protected intelligence APIs. The UI does not bypass API authorization. If no manager/admin bearer token is available, the page renders an explicit unauthorized state with request correlation IDs.

## Current Token Discovery

The client adapters look for an access token in browser local storage keys:

- `salora_access_token`
- `salora.accessToken`
- `accessToken`

This should be replaced by a first-class SALORA session bridge when the production auth UX is finalized.
