# SALORA P21 — Menu Collections Domain Foundation

## Status

Repository implementation only. The migration is generated and reviewed by tests, but is **not applied** to Supabase or any production database by the P21 installer.

## Domain guarantees

1. The existing SALORA product catalog remains authoritative.
2. Menu collections reference `catalog_products.id`; they never duplicate products, prices, media, stock, variants, modifiers, or availability.
3. One product may belong to multiple menu experiences through `MenuCollectionProduct`.
4. Nutrition and allergen profiles are one-to-one product records with source, recipe/ingredient version, verification state, reviewer, review timestamp, validity date, and archival state.
5. Wellness and Kids publication readiness requires verified food data.
6. Revisions are immutable after insertion.
7. Publication and rollback reference immutable revisions.
8. Deletes are not granted through collection-domain RLS policies; archival is the operational path.
9. Editing, content review, food-safety review, approval, publication, and rollback are distinct permissions.
10. Every service mutation writes to the existing generic `audit_logs` ledger.

## Added domain entities

- `MenuCollection`
- `MenuCollectionSection`
- `MenuCollectionProduct`
- `ProductNutritionProfile`
- `ProductAllergenProfile`
- `MenuCollectionRevision`
- `MenuPublication`
- `MenuRolePermission`

## Default permission mapping

| Role | Permissions |
|---|---|
| STAFF | VIEW |
| MANAGER | VIEW, EDIT, REVIEW_CONTENT, REVIEW_FOOD_SAFETY |
| ADMIN | VIEW, EDIT, REVIEW_CONTENT, REVIEW_FOOD_SAFETY, APPROVE, PUBLISH, ROLLBACK |

The service role bypass remains reserved for trusted backend operations.

## Workflow

`DRAFT → CONTENT_REVIEW → FOOD_SAFETY_REVIEW → APPROVED → SCHEDULED/PUBLISHED`

Rejection returns the collection to a previous review or draft state with an audit reason. A published collection can be paused or archived. Rollback publishes a previously immutable revision as a new publication event.

## Database safety

The migration:

- creates only P21 domain types, tables, constraints, indexes, functions, triggers, policies, and default permission rows;
- creates foreign keys to existing catalog products;
- does not insert, update, delete, truncate, or replace catalog products or categories;
- enables RLS on every new table;
- exposes only published collections and verified food profiles to public readers;
- keeps drafts, reviews, revisions, publications, and role grants private.

## Required staging sequence

1. Review the generated migration.
2. Take a Supabase backup.
3. Apply to a non-production/staging database.
4. Regenerate Prisma.
5. Run the P21 domain test.
6. Run full tests and production build.
7. Verify RLS with anon, staff, manager, and admin JWTs.
8. Confirm 117 products and 16 categories remain unchanged.
9. Approve production execution separately.

## P21 acceptance gate

- Prisma schema validates.
- Prisma client generates.
- P21 contract test passes.
- Full SALORA tests pass.
- Production build passes.
- `git diff --check` passes.
- No production database write or deployment occurs.
