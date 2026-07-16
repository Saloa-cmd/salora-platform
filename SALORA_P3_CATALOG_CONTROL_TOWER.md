# SALORA P3 — Bilingual Catalog and Control Tower

## Scope

- 117 bilingual products across 17 ordered categories.
- Existing Supabase/PostgreSQL and Prisma architecture retained.
- `brand_key = SALORA` defense-in-depth isolation on categories and products.
- RLS policies constrain public reads and manager writes to the SALORA catalog and its child records.
- Products with approved prices are created as `ACTIVE`; products marked “to be priced” are created as hidden `DRAFT` records with price `0.000`.
- Seed is idempotent and does not overwrite operator-controlled prices, statuses, add-ons, or modifiers on repeat runs.
- Control Tower manages bilingual content, prices, lifecycle status, images, variants, add-ons, and modifier groups.
- All protected mutations require catalog permissions and produce activity/audit records.

## Image governance

Every product receives a brand-consistent, product-specific image prompt as a `ProductMediaDraft`. A prompt is not an image and cannot appear publicly. The existing media workflow remains mandatory:

1. Generate or upload the actual asset.
2. Review product accuracy and brand consistency.
3. Approve the draft.
4. Publish it to `ProductImage`.

No AI image, description, or price is automatically published.

## Safe deployment order

1. Back up the database.
2. Apply `202607160001_salora_bilingual_catalog` in staging.
3. Regenerate Prisma Client.
4. Run `pnpm verify:salora-menu`.
5. Run `pnpm seed:salora-menu` against staging.
6. Verify RLS with anon, staff, manager, and admin identities.
7. Review draft prices and image prompts in Control Tower.
8. Promote only approved records to production.
