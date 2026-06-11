# P0 Supabase Authority Certification

Date: 2026-06-07

## Scope

P0-2 Supabase Production Authority.

## Environment Authority

| Item | Result | Evidence |
| --- | --- | --- |
| `DATABASE_URL` present | PASS | Key exists in `.env`; value not printed. |
| `DIRECT_URL` present | PASS | Key exists in `.env`; value not printed. |
| Prisma connectivity | PASS | Prisma migration status connected to PostgreSQL. |
| Active project identity | PASS | Host observed: `db.grcycqdtjjfklibutfos.supabase.co:5432`. |
| Migration status | PASS | 9 migrations found; database schema is up to date. |

## Production Counts

Read through Prisma against the configured database:

| Entity | Count |
| --- | ---: |
| Products | 96 |
| Categories | 15 |
| Users | 1 |
| Product images | 0 |
| Product media drafts | 12 |
| Orders | 0 |

Database identity:

- Database: `postgres`
- User: `postgres`
- Port: `5432`
- Server address captured as IPv6 address only; no credential or URL was documented.

## Status

SUPABASE_AUTHORITY_VERIFIED
