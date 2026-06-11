# SALORA Soft Launch Readiness Board

Date: 2026-06-05  
Target: `SALORA_READY_FOR_10_USER_SOFT_LAUNCH`

## Final Decision

**APPROVED_WITH_RESTRICTIONS**

SALORA is commercially usable for a controlled 10-user soft launch only with restrictions:
- COD-only checkout.
- No reliance on WhatsApp live outbound until an eligible recipient/opt-in is configured and verified.
- Product images must be uploaded before visual public launch claims.
- Mobile launch should be limited until device API smoke is completed.

## Board Classification

| Area | Status | Evidence |
|---|---|---|
| Runtime | ACTIVE | Prisma runtime `SELECT 1`, schema validate, migrate status, generate all PASS |
| Control Tower | PARTIAL | rollback-safe operational mutations passed; HTTP/browser UI smoke not completed |
| Website | PARTIAL | DB product/category/price path exists; fallback remains; product images are 0 |
| Mobile | PARTIAL | menu API path exists and typecheck passes; simulator/device API sync not executed |
| OpenAI | ACTIVE | commercial generation returned HTTP 200; draft persistence rollback passed |
| Product Media | PARTIAL | ProductMediaDraft create/approve passed; no real assets exist |
| COD Orders | ACTIVE | COD lifecycle rollback passed; no Stripe intent created; COD flags enabled |
| WhatsApp | BLOCKED | Meta phone object verified, but no eligible recipient; live send not executed |
| Sentry | ACTIVE | sanitized staging error event created and flushed |
| Stripe Test Runtime | PARTIAL | Stripe credentials were previously verified, but soft-launch runtime now disables Stripe for COD-only |

## Validation Gates

| Gate | Result | Notes |
|---|---|---|
| `prisma validate` | PASS | schema valid |
| `prisma migrate status` | PASS | 9 migrations; database schema up to date |
| `prisma generate` | PASS | Prisma Client generated |
| `pnpm lint` | PASS | Node engine warning only |
| `pnpm typecheck` | PASS | web and mobile |
| `pnpm test` | PASS | full scripted suite passed |
| `pnpm build` | PASS | Next production build completed |

Environment warning:
- Current local Node: `v24.15.0`.
- Project engine: `>=22 <23`.
- Use Node 22.x for soft-launch runtime.

## Remaining Blockers

1. WhatsApp live send is blocked by missing eligible recipient / customer opt-in.
2. Product images are `0 / 96`; no visual product launch claim should be made.
3. Website fallback data remains; browser smoke should verify Supabase rendering.
4. Mobile static fallback remains in several screens; device/simulator API smoke is required.
5. Control Tower browser/API smoke remains to promote from PARTIAL to ACTIVE.

## Exact Next Step

Upload real P0 product images for the 12 listed products, then run ProductMediaDraft publish into ProductImage and verify the public website renders the primary image from Supabase.
