# P22 Production Menu Compatibility Hotfix

## Confirmed incident

Production returned Prisma P2021 because
`public.product_nutrition_profiles` does not exist.

## Root cause

The legacy compatibility loader queried optional P21 nutrition and allergen
relations. Production predates those tables, so the compatibility query failed
before returning the existing authoritative catalog.

## Fix

The legacy catalog loader no longer joins or maps optional P21 nutrition and
allergen profile relations.

Published contractVersion 2 revisions continue to expose verified nutrition and
allergen summaries from their immutable snapshot.

## Safety

- No schema migration.
- No database write.
- No catalog duplication.
- No static JSON fallback.
- No production environment change.
- The 117-product source authority remains unchanged.

## Expected result after deployment

- `/menu` displays the catalog.
- `/api/v1/menu-authority` returns HTTP 200 using `legacy-catalog`.
- `/api/products` returns HTTP 200.
- `/api/ready` may remain HTTP 503 until canonical production activation, but
  must no longer return HTTP 500.
