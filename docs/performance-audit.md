# SALORA Performance Audit

Date: 2026-06-05
Workspace audited: `C:\dev\salora-platform`

## Evidence Base

- `pnpm build` completed successfully.
- Build observed: Next.js 16.2.6 compiled in 109 seconds, TypeScript in 33.7 seconds, and generated 34 static pages.
- Control Tower front-end components perform multiple concurrent API fetches.
- Several API routes read full datasets without visible pagination in the inspected paths.

## Findings

| Area | Classification | Finding | Evidence |
|---|---:|---|---|
| Build performance | PARTIAL | Build succeeds but compile time is high for the current platform size. | `pnpm build` completed with 109s compile time. |
| Control Tower refresh | PARTIAL | Simple Launch center fetches products, categories, coupons, promotions, flags, activity logs, and audit logs together. | `SimpleLaunchOperationsCenter` client behavior. |
| Product queries | PARTIAL | Product list flows can read broad product/image/category payloads. | Product API and public menu DB read path. |
| Media queries | PARTIAL | Media route can load product images and media drafts; pagination was not proven. | Control Tower media route and Supremacy media calls. |
| Orders | ACTIVE/PARTIAL | Control Tower orders are bounded but need index review for status/time dashboard usage. | Orders route and schema indexes. |
| Public menu | PARTIAL | Public products can fall back to static dataset if DB read fails, masking DB latency/outage. | `apps/web/lib/server/publicMenu.ts`. |
| Mobile menu | PARTIAL | Mobile menu initializes with static fallback products and keeps fallback on API failure. | `apps/mobile/app/(tabs)/menu.tsx`. |
| Rate limiting | PARTIAL | In-memory process limiter does not scale across instances. | `apps/web/proxy.ts`. |

## Bottlenecks and Risks

- Large Control Tower dashboard payloads will grow with catalog, order, log, and media volume.
- Static fallbacks improve resilience but reduce observability because failures can look like successful empty/old data.
- Build performance may slow developer feedback and CI.
- Generated artifacts in multiple locations can increase TypeScript/build churn.

## Recommendations

- Add pagination and query limits to Control Tower products, media, promotions, coupons, logs, and customer-facing lists.
- Add explicit stale/fallback indicators where static data is shown after DB errors.
- Review compound indexes for dashboard filters: status plus created time, product plus status, and media draft lifecycle queries.
- Keep build timing in validation reports to track regression.
