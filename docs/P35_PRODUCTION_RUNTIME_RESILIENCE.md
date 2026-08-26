# P35 — Production Runtime Resilience

Date: 2026-08-26

## Scope

P35 hardens the Vercel-to-Supabase runtime path without changing database schema,
menu rows, pricing, availability, media assignments, or the published revision.

## Verified production baseline

- GitHub source of truth: `main` at `95717718bc97829122635e7d05de271e505d1ff3`.
- Vercel production deployment: `dpl_398UcYCouyacwZuFYps1AQJgumU4`, READY.
- Supabase production project: healthy PostgreSQL 17.
- Catalog invariant: 117 products = 104 ACTIVE + 13 DRAFT.
- Menu Authority: one SALORA collection with revision 1 in PUBLISHED state.
- PostgreSQL connection ceiling: 60; observed at inspection: 1 active, 4 idle.
- Production mutations during diagnosis: NONE.

## Evidence

Vercel grouped the active failures on `/` and `/menu` as:

- 9 × `Query read timeout`
- 6 × `Connection terminated due to connection timeout`

Supabase PostgreSQL logs independently showed client connection resets. Earlier
deployments also exposed interactive transaction expiry and overlapping
`client.query()` warnings; the current published Menu Authority read is already
sequential and service-role reads no longer require an interactive transaction.

## Remediation

1. Create an explicit `pg.Pool` and pass that pool to `PrismaPg`.
2. Attach the pool to Vercel Fluid Compute so idle clients are released before
   an instance suspends.
3. Limit each instance to two clients by default, rotate connections after five
   minutes, and retire idle clients after five seconds.
4. Separate connection acquisition timeout from SQL query timeout.
5. Probe every idle client after a suspended interval; destroy failed clients
   before Prisma can reuse them.
6. Retry only read operations and only for classified connectivity failures.
7. Keep Menu Authority cache revalidation single-flight, extend the safety
   interval to five minutes, retain on-demand tag invalidation after publish or
   rollback, and serve the last known good published snapshot if a warm-instance
   refresh fails.

## Safety gates

- No migration file.
- No Supabase DDL or DML.
- No seed or catalog file change.
- No Production environment variable mutation.
- No Production deployment or merge without a separate merge gate.

## Required verification

- P35 regression test.
- Existing Prisma concurrency regression.
- Existing Menu Authority and 117-product invariants.
- Full typecheck, test, lint, and Next.js build in CI.
- Vercel Preview smoke on `/`, `/menu`, `/api/v1/menu-authority`, and
  `/api/ready`.
- Runtime error scan after Preview traffic.


