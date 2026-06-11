# SALORA Website Production Certification

Date: 2026-06-08

Scope: `apps/web`, public menu rendering, product API, SEO metadata, sitemap, robots, image handling, runtime/fallback visibility.

No UI changes were made.

## Decision

PARTIAL

The public website is database-backed in code and exposes fallback/stale state, but commercial certification is partial because product images are absent, placeholder contact/location copy remains, browser smoke was unavailable, and database RLS is not active.

## Evidence

| Area | Evidence | Result |
| --- | --- | --- |
| Product source | `apps/web/lib/server/publicMenu.ts` reads database first and returns fallback only with `stale=true` | PASS in code |
| Homepage visibility | `apps/web/app/page.tsx` renders a visible stale/fallback banner when `menuSnapshot.stale` is true | PASS in code |
| Product API runtime metadata | `/api/products` returns `runtime.source`, `runtime.stale`, `runtime.mode`, `runtime.databaseHealth`, and headers | PASS in code |
| Readiness behavior | `/api/ready` requires `catalogLive` and fails stale/fallback menu mode | PASS in code |
| Live catalog counts | 96 active products and 15 categories found through read-only database inspection | PASS |
| Product images | 0 `ProductImage` records found | BLOCKER for polished commercial menu |
| SEO metadata | `apps/web/app/layout.tsx`, `robots.ts`, and `sitemap.ts` exist | PARTIAL |
| Open Graph | Basic Open Graph title/description/type/url present; no verified product/social image asset | PARTIAL |
| Commercial contact copy | Homepage footer includes placeholder WhatsApp/location wording | PARTIAL |
| Browser smoke | Local server was not reachable during certification | BLOCKED |

## Risks

| Risk | Business Impact | Required Action |
| --- | --- | --- |
| No product image records | Public menu cannot present real product media | Upload and approve real assets through ProductMediaDraft to ProductImage workflow |
| Placeholder commercial copy | Customer trust and launch polish risk | Replace placeholders through approved content/runtime config path |
| Stale fallback exists by design | Safe resilience, but launch must fail when stale | Keep `/api/ready` fail-fast behavior and monitor runtime headers |
| RLS disabled live | Public database exposure risk if direct Supabase access is used | Complete database hardening before launch |

