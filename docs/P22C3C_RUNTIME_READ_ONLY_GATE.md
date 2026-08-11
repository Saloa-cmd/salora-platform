# P22C-3C — Production Runtime Read-Only Gate

Status: **RUNTIME READ ONLY — temporary Production certification gate**

This gate exists only because Vercel stores `DATABASE_URL` as a Sensitive
Environment Variable. Sensitive values are available to the Production
runtime but cannot be decrypted back to the local certification controller.

## Safety contract

- Production only.
- Exact Supabase project ref: `grcycqdtjjfklibutfos`.
- `DATABASE_URL` is consumed in memory only and is never returned or logged.
- Connection is forced to `default_transaction_read_only=on`.
- Snapshot uses `REPEATABLE READ` and intentionally rolls back.
- Preflight uses `SERIALIZABLE` and intentionally rolls back.
- Runtime SQL is test-locked to the certified P22C-3C SQL artifacts.
- The endpoint is POST-only.
- Access uses an ephemeral random token; only its SHA-256 is committed.
- The gate has an automatic expiration timestamp.
- No Migration is applied.
- No DDL or catalog DML is executed.
- No environment variable is created, edited, or deleted.
- No migration ledger is touched.

## Certified operation

1. Verify Vercel runtime is Production.
2. Validate `DATABASE_URL` contains the exact Production project ref and
   rejects known Staging/non-Production refs.
3. Create a dedicated Prisma/PrismaPg client with fail-closed read-only
   connection options.
4. Verify PostgreSQL 17+, not recovery, and read-only default.
5. Execute the certified Snapshot query.
6. Rollback Snapshot transaction intentionally.
7. Execute the certified Preflight block and result query.
8. Rollback Preflight transaction intentionally.
9. Return sanitized evidence only.

The route does not expose database/user credentials. The returned evidence
contains counts, fingerprints, authority-object presence, safe server
metadata, deployment commit SHA, and explicit safety assertions.

This gate does **not** authorize Production DDL. A successful PASS only
certifies readiness for a later separately approved migration decision.
