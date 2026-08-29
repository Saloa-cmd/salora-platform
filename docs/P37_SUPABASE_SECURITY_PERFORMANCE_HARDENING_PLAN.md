# SALORA P37 — Supabase Security & Performance Hardening

P37 is intentionally separate from P36. No item in this plan is implemented by the P36 branch.

## Scope

- Enable leaked-password protection after authentication impact review.
- Validate and add only justified indexes for the 24 reported unindexed foreign keys.
- measure the 78 currently unused indexes over a representative observation window before any removal decision.
- consolidate the 24 overlapping permissive SELECT policy groups without changing intended access.
- re-run Security and Performance Advisors, query plans, RLS role tests, and regression suites.

## Gates

1. Read-only inventory and workload evidence.
2. Staging SQL with forward and rollback scripts.
3. Role-by-role RLS matrix and `EXPLAIN (ANALYZE, BUFFERS)` evidence.
4. Backup/restore evidence and lock-duration estimate.
5. Separate Production migration approval.

P37 must not reuse P36 UI approval as database authority. Any Production DDL requires the explicit message `PRODUCTION DATABASE MIGRATION APPROVAL REQUIRED`.
