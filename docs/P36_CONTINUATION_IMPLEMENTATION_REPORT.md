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

The commits between the historical Production SHA and current `main` are documentation-only. No application, runtime configuration, database/schema, or security-sensitive change was found in that range. Vercel automatically deployed the merged documentation commit, so the older deployment is a rollback reference rather than the current deployment.

## Price authority

The owner message dated 2026-08-29 is the approval source. The implementation records currency `OMR`, precision three decimals, and the explicit Production review baseline `0.000`.

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

The machine-readable Price and Media Manifest is in `apps/web/lib/control-tower/p36ActivationManifest.ts` and contains the resolved Product IDs, bilingual names, approved price, candidate path, bilingual alt text, and SHA-256 for each asset.

## Media review state

Thirteen existing Library images were selected and visually inspected. They were normalized to 1200 × 1200 WebP candidates and stored under `apps/web/public/products/p36-media-candidates/`. Every candidate has a SHA-256 checksum in the manifest. The generic SALORA Latte asset was selected instead of the caramel variant because caramel is not certified by the product data.

These files are Preview review candidates only. They have not been uploaded to Production Storage and no ProductImage row has been created or published. The Contact Sheet inside Control Tower is the required evidence surface for the `APPROVE13MEDIA` gate.

## P36 implementation

- P36-A: Operator-first Catalog Command Center, authoritative metrics, bilingual search, readiness filters, persisted table/gallery views, pagination beyond 100, and quick actions.
- P36-B: responsive product cards, no mobile table overflow, 44 px minimum actions, RTL/LTR and theme-compatible surfaces.
- P36-C: product-aware palette actions and review-only contextual AI for description, translation, alt text, and readiness. AI cannot mutate, approve, activate, archive, delete, publish, or roll back.
- P36-D: Draft/Published/Split Experience preview using the existing renderer, with device, locale, direction, and theme controls.
- P36-E: unified Publish Center workflow with validation, diff, preview, approval, publication, verification, and rollback surfaces. It fails closed when Menu Authority records are absent.
- Product creation is Draft-first; server permissions, validation, readiness gates, activity logs, and audit logs remain authoritative.
- Vercel Preview mutations fail closed unless `SALORA_PREVIEW_DATA_ISOLATED=true` certifies an isolated non-Production data binding.

## Environment parity blocker

Read-only inspection of connected Supabase project `grcycqdtjjfklibutfos` returned 117 ACTIVE products, the 13 approved prices, and live image records, but no MenuCollection, MenuCollectionRevision, or MenuPublication records. Vercel Production simultaneously returns Menu Authority revision v1 with 104 visible products and `catalogStale=false`.

This proves that the Supabase connector and Vercel Production are not observing the same authoritative data state. Production ProductImage creation, price writes, activation, and Revision v2 publication must remain blocked until the exact Vercel database project/ref and the authority records are reconciled read-only.

## Verification

- Node `22.23.1` and pnpm `11.7.0`: compliant.
- Full repository test command: passed.
- P36 continuation guard: passed.
- Web and mobile typecheck: passed.
- Production build: passed.
- No schema or migration impact.
- No Production data impact.

## Approval sequence

1. Reconcile and certify Vercel/Supabase binding parity.
2. Review the 13-candidate Contact Sheet and provide `APPROVE13MEDIA`.
3. Review Preview, CI, security evidence, and provide `MERGE-P36-CONTINUATION`.
4. After media records, prices, and readiness are proven in the certified Production binding, provide `ACTIVATE117`.

Rollback remains Revision v1, the last verified Production deployment, Draft status restoration, previous price restoration, and archival—not deletion—of new image records.
