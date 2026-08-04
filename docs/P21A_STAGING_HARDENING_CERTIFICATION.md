# SALORA P21A — Staging Hardening Certification

## Status

P21A is an additive repository hardening follow-up discovered while certifying
P21 against an isolated Supabase staging project.

The staging project is not production and contains **synthetic certification
fixtures**, not customer, order, payment, authentication, or production catalog
records.

## Isolated staging environment

- Project: `salora-p21-staging`
- Project ref: `wauwsfrckjjwwmdhifjt`
- Region: `ap-southeast-2`
- PostgreSQL: `17.6`
- Status during certification: `ACTIVE_HEALTHY`
- Source repository merge: `2cb323a52213d460251b9d008a16e192a2f8038b`

## Certification fixture

The isolated fixture mirrors the authoritative catalog cardinality without
copying production data:

- 117 products
- 16 categories
- 92 active-by-price products
- 25 products awaiting price

## P21 structural results

- 8 P21 tables
- 8 tables with RLS enabled
- 22 RLS policies before policy splitting
- 11 foreign keys
- 11 governance triggers
- 7 P21 governance functions
- 12 default role permissions

## Behavioural certification

Transactional tests were executed and rolled back for:

- `anon`
- `STAFF`
- `MANAGER`
- `ADMIN`
- service-role revision immutability

Validated behaviours:

- public readers see only published collections and verified food profiles;
- STAFF can view but cannot edit;
- MANAGER can edit and submit content but cannot approve;
- ADMIN can approve, publish, roll back, and administer permission rows;
- immutable revisions reject service-role mutation;
- verified food data requires provenance, reviewer, and review timestamp;
- test records are absent after rollback.

## Security findings and remediation

Initial Supabase advisors identified:

- mutable function search paths;
- externally executable `SECURITY DEFINER` permission helpers;
- a staging metadata table with RLS but no policy.

Staging remediation verified:

- permission/JWT helpers changed to `SECURITY INVOKER`;
- all relevant function search paths fixed;
- staging metadata restricted to ADMIN;
- Security Advisor: 0 findings.

## Performance findings and remediation

Actionable findings:

- missing direct index for `menu_collection_products.section_id`;
- overlapping permissive SELECT policy caused by
  `menu_role_permissions_admin_write FOR ALL`.

P21A adds the direct index and splits the ADMIN write policy into INSERT,
UPDATE, and DELETE policies.

Remaining performance findings were only fresh-database `unused_index` INFO
notices. They are expected before representative traffic exists and are not a
reason to remove planned indexes.

## Production isolation proof

Production database unchanged:

- 53 existing database products
- 9 existing database categories
- no P21 collection tables present
- no P21 migration applied
- no customer, order, payment, or production deployment mutation

## Repository gate

This follow-up must pass:

1. Node `22.23.1`
2. pnpm `11.7.0`
3. P21A contract test
4. complete SALORA tests
5. production web build
6. `git diff --check`
7. pull-request review

No database migration is applied by the repository installer.
