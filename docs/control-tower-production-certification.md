# SALORA Control Tower Production Certification

Date: 2026-06-08

Scope: `/control-tower`, Control Tower API guards, auth runtime, route registry, media/orders/WhatsApp/AI/config routes, existing browser/session availability.

No login bypass was performed. No admin bootstrap was performed. No Control Tower mutation was executed.

## Decision

PARTIAL

Control Tower code has page guards, API permission guards, Prisma-backed production auth, and registered section routes, but runtime certification is partial because no authenticated browser session was available in the in-app browser and the local server was not reachable at `http://localhost:3000`.

## Evidence

| Area | Evidence | Result |
| --- | --- | --- |
| Page guard | `/control-tower` and `/control-tower/[section]` call `requireControlTowerPageAccess()` | PASS in code |
| Cookie guard | `salora_access_token` and `salora_refresh_token` are HTTP-only cookies; production cookies are secure | PASS in code |
| API guard | Control Tower APIs use `requireApiPermission()` / `currentAuthPayload()` with bearer authorization | PASS in code |
| Client token path | `apps/web/lib/control-tower/client.ts` sends bearer token from dashboard client token storage | PASS in code |
| Production repository | `apps/web/lib/server/auth/runtime.ts` uses `PrismaAuthRepository` in production | PASS in code |
| Section registry | Build output includes `/control-tower` and `/control-tower/[section]` | PASS in build |
| Browser smoke | In-app browser had only `about:blank`; no authenticated SALORA session available | BLOCKED |
| Local server | `http://localhost:3000/api/products` was not reachable during certification | BLOCKED |

## Route Coverage

Build output confirms registered dynamic/server routes for:

- `/api/control-tower/ai-studio`
- `/api/control-tower/config`
- `/api/control-tower/instagram`
- `/api/control-tower/media`
- `/api/control-tower/orders`
- `/api/control-tower/runtime-governance`
- `/api/control-tower/simple-launch/activity-logs`
- `/api/control-tower/simple-launch/ai-product-tools`
- `/api/control-tower/simple-launch/audit-logs`
- `/api/control-tower/simple-launch/categories`
- `/api/control-tower/simple-launch/coupons`
- `/api/control-tower/simple-launch/feature-flags`
- `/api/control-tower/simple-launch/product-images`
- `/api/control-tower/simple-launch/products`
- `/api/control-tower/simple-launch/promotions`
- `/api/control-tower/simple-launch/runtime-config`
- `/api/control-tower/whatsapp`

## Risks

| Risk | Impact | Required Action |
| --- | --- | --- |
| Authenticated browser smoke unavailable | Cannot certify rendered Control Tower behavior, session persistence, sidebar interaction, or section navigation live | Re-run with existing authenticated session only |
| API bearer versus page cookie split | Pages can pass cookie guard while client API calls require bearer token storage | Verify dashboard login stores bearer token expected by Control Tower client |
| WhatsApp and order routes catch some downstream failures | Failures can be masked as empty arrays or non-blocking notification failure | Add explicit runtime failure surfacing before launch |
| RLS disabled live | Control Tower authorization is app-layer only until database policies are applied and tested | Complete database security remediation |

