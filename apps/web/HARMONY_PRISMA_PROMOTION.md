# Harmony Prisma Domain Promotion

PR #89 intentionally keeps `membership_code` and `harmony_consents` as migration-backed compatibility extensions. Runtime access remains constrained SQL inside the existing transaction/RLS boundaries because the generated Prisma domain for this release does not declare these extensions.

Future promotion is deliberately separate from this release:

1. Promote the migration-backed fields/tables into `prisma/schema.prisma`.
2. Run the repository-standard `prisma generate`.
3. Replace compatibility SQL with a typed repository.
4. Remove the compatibility assertions only after schema, generated client, runtime and migrations agree.

The PR regression gate asserts that the schema does not partially declare this domain, preventing a schema/client drift from being hidden behind casts.
