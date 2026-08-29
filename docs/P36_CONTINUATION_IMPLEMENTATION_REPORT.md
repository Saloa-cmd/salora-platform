# SALORA P36 — Continuation implementation report

Date: 2026-08-29
Scope: Preview/Test application implementation only. No merge, Production DML, migration, media upload, status activation, or Revision v2 publication was performed.

## Verified baseline and divergence

| Item | Verified state |
|---|---|
| Historical Production SHA | `4e6cd7bc6ab232059c535bcace98918baa481803` |
| Current `origin/main` | `c1551cf237e2806d697b3b8bdbeabab5cee851b7` |
| Continuation branch base | `c1551cf237e2806d697b3b8bdbeabab5cee851b7` |
| PR #63 | Merged; plan document only |
| Current Vercel Production deployment | `dpl_Grwuunh3HqMrAB2J3uVnzYvLRtNK` — READY |
| Current Vercel Production Git SHA | `c1551cf237e2806d697b3b8bdbeabab5cee851b7` |
| Certified Production Supabase project | `salora-production` — `ACTIVE_HEALTHY` |
| Production catalog snapshot | 117 total · 104 ACTIVE · 13 DRAFT · 13 zero prices · 13 missing live images |
| Production Menu Authority | 3 collections · 1 revision · 1 publication · `salora-menu` PUBLISHED |

The commits between the historical Production SHA and current `main` are documentation-only. No application, runtime configuration, database/schema, or security-sensitive change was found in that range. Vercel automatically deployed the merged documentation commit, so the older deployment is a rollback reference rather than the current deployment.

## Price authority

The manifest records the latest available owner-approved 13-item pricing table dated 2026-08-27 as the approval source. The implementation records currency `OMR`, precision three decimals, and the explicit Production review baseline `0.000`; it does not infer any price from category averages or staging data.

| Slug | Product | Approved price |
|---|---|---:|
| `bahr` | Bahr | 1.700 OMR |
| `brazilian-lemonade` | Brazilian Lemonade | 1.400 OMR |
| `khayal` | Khayal | 1.800 OMR |
| `pina-colada` | Piña Colada | 1.700 OMR |
| `awar-qalb` | Awar Qalb | 1.900 OMR |
| `strawberry-milkshake` | Strawberry Milkshake | 1.600 OMR |
| `berry-detox` | Berry Detox with Stevia | 1.600 OMR |
| `protein-shake` | Protein Shake | 2.000 OMR |
| `peanut-butter-latte` | Peanut Butter Latte | 1.700 OMR |
| `pistachio-espresso` | Pistachio Espresso | 1.400 OMR |
| `pistachio-spanish-latte` | Pistachio Spanish Latte | 1.800 OMR |
| `salora-cappuccino` | SALORA Cappuccino | 1.500 OMR |
| `salora-latte` | SALORA Latte — Hot or Iced | 1.600 OMR |

The machine-readable Price and Media Manifest is in `apps/web/lib/control-tower/p36ActivationManifest.ts` and contains the Production Product IDs, bilingual names, approved price, candidate path, byte size, bilingual alt text, and SHA-256 for each asset. The 13 IDs were re-resolved from `salora-production`; the earlier staging IDs were removed.

## Media review state

Thirteen existing candidate images were visually inspected and normalized to 1200 × 1200 sRGB WebP under `apps/web/public/products/p36-media-candidates/`. Every selected candidate has its byte size and SHA-256 checksum in the manifest. Library search returned no indexed image files in this session, so provenance is recorded as repository candidate evidence rather than an independently re-resolved Library reference.

Production product descriptions did not prove specific ingredients for Awar Qalb, Khayal, or Protein Shake. Their first candidates showed identifiable fruit, flowers, banana, or nuts, so they were not selected. Neutral `-v2` candidates were generated without identifiable ingredients or garnish; the original files remain preserved as superseded review history. The generic SALORA Latte asset remains selected instead of a caramel variant because caramel is not certified by the product data.

The owner approved the exact 13-file review set with `APPROVE13MEDIA` at `2026-08-29T11:49:10Z`. This approves the reviewed bytes only and does not authorize Production upload, DML, activation, or publishing. The files have not been uploaded to Production Storage and no ProductImage row has been created or published. The downloadable `P36_MEDIA_CONTACT_SHEET.png` artifact and the Contact Sheet inside Control Tower are the approval evidence surfaces. The standalone sheet SHA-256 is `d12bf97d2aa0cb2075a85c636aaa30843ef5e073a1a706c2828cf60ec96e58bc`.

## P36 implementation

- P36-A: Operator-first Catalog Command Center, authoritative metrics, bilingual search, readiness filters, persisted table/gallery views, pagination beyond 100, and quick actions.
- P36-B: responsive product cards, no mobile table overflow, 44 px minimum actions, RTL/LTR and theme-compatible surfaces.
- P36-C: product-aware palette actions and review-only contextual AI for description, translation, alt text, and readiness. AI cannot mutate, approve, activate, archive, delete, publish, or roll back.
- P36-D: Draft/Published/Split Experience preview using the existing renderer, with device, locale, direction, and theme controls.
- P36-E: unified Publish Center workflow with validation, diff, preview, approval, publication, verification, and rollback surfaces. It fails closed when Menu Authority records are absent.
- Product creation is Draft-first; server permissions, validation, readiness gates, activity logs, and audit logs remain authoritative.
- ProductImage creation and replacement now reject arbitrary external URLs, unsafe paths, redirects, mismatched Supabase origins, MIME types, dimensions, byte sizes, and SHA-256 checksums. Archival preserves records and does not set `deletedAt`.
- The sequential bulk activation write was removed from the client. The 13 P36 slugs fail closed server-side unless `SALORA_ACTIVATE117_APPROVED=true`, the actor is an Admin, and readiness passes.
- Vercel Preview mutations fail closed unless `SALORA_PREVIEW_DATA_ISOLATED=true` certifies an isolated non-Production data binding.

## Environment parity result

Read-only inspection proved that `salora-production` contains the expected authoritative baseline: 117 products, 104 ACTIVE, 13 DRAFT, 13 prices at `0.000`, 104 live ProductImage records, one MenuCollectionRevision and one MenuPublication. The 13 blocked Production Product IDs are now recorded in the manifest.

The separate `salora-staging` project contains 117 ACTIVE products and live images but no Menu Authority records. It remains unsuitable as Production evidence or as a Revision v2 source. Vercel Production and `salora-production` now have matching catalog/revision counts, but Production ProductImage creation, price writes, activation, and Revision v2 publication remain blocked by the explicit approval gates.

## Verification

- Required toolchain: Node `22.23.1`, pnpm `11.7.0`. The local runner exposes Node `24.19.0`, so the repository toolchain doctor correctly fails closed; CI must certify the pinned runtime.
- Web TypeScript: passed locally.
- Web ESLint: passed locally.
- Next.js production build: passed locally (35 static pages generated; all dynamic routes compiled).
- P25/P26/P30/P31/P32/P33/P35/P36 regression contracts: passed when run individually; the aggregate command stops only at the Node toolchain doctor in this runner.
- P36 continuation guard: passed with 13 price records and 13 verified media checksums.
- Secret scan of the P36 diff: no database URL, service-role key, private key, or provider secret pattern found.
- `pnpm audit --prod`: 0 critical, 25 high, 23 moderate, and 3 low transitive dependency findings. They predate this P36 diff and include Expo/CLI, Prisma tooling, Hono, Sharp and related trees; no dependency or lockfile change is included here. They must be triaged before merge rather than silently waived.
- No Prisma schema or migration impact.
- No Production data impact.

## Approval sequence

1. `APPROVE13MEDIA` — completed on 2026-08-29 for the exact checksummed 13-file set.
2. Review Preview, CI, security evidence, and provide `MERGE-P36-CONTINUATION`.
3. After media records, prices, and readiness are proven in the certified Production binding, provide `ACTIVATE117`.

Rollback remains Revision v1, the last verified Production deployment, Draft status restoration, previous price restoration, and archival—not deletion—of new image records.
