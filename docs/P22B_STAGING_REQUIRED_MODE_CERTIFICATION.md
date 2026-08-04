# SALORA P22B — Staging Required-Mode Certification

## Preflight finding

The isolated SALORA Staging database contains the correct catalog authority:

- 117 unique products;
- 104 ACTIVE;
- 13 DRAFT;
- 16 standard-menu sections.

At P22B preflight, the active staging revision was created before the canonical
repository contract and did not expose `contractVersion: 2`. Therefore
`SALORA_MENU_AUTHORITY_MODE=required` must not be enabled until a canonical
revision is activated on Staging.

## Ordered certification gate

1. Merge and synchronize the P22B repository implementation.
2. Build with Node 22.23.1 and pnpm 11.7.0.
3. Create a canonical immutable revision through the repository revision
   builder using Staging only.
4. Activate that revision on the already-published Staging collection.
5. Start the application locally or in an isolated preview with:
   `SALORA_MENU_AUTHORITY_MODE=required`.
6. Execute `pnpm certify:p22b:staging`.
7. Verify Website, QR and compatibility API revision IDs match.
8. Verify mobile and AI contract tests reference the same revision authority.
9. Run security and performance advisors.
10. Record rollback evidence.

## Production prohibition

This certification does not authorize:

- a production migration;
- a production data update;
- a production environment-variable change;
- a production deployment;
- merging a Supabase branch into production.
