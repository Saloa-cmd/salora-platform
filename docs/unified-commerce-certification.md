# Unified Commerce Certification

Date: 2026-06-03

## Status

Status: PARTIAL_PENDING_MIGRATION_AND_SMOKE_TEST

## Data Flow

```text
Control Tower
-> Supabase PostgreSQL
-> Public product API
-> Website
-> Mobile
```

## Certification Matrix

| Area | Status | Evidence |
| --- | --- | --- |
| Products | ACTIVE | Control Tower writes `catalog_products`; website/mobile read DB products. |
| Product images | PARTIAL | Published image reads exist; draft approval requires new migration deployment. |
| Promotions | PARTIAL | DB-backed offers exist; new lifecycle values require migration deployment. |
| Coupons | ACTIVE | DB-backed create/toggle exists. |
| Orders | IMPLEMENTED_PENDING_MIGRATION | `/api/orders` and Control Tower orders now target `cafe_orders`. |
| Customers | PARTIAL | Schema exists; launch view is read-focused. |
| Loyalty | PARTIAL | Schema exists; launch view is read-focused. |
| AI Studio | ACTIVE_PENDING_SMOKE | Draft storage and no-auto-publish rules exist. |
| Runtime Governance | ACTIVE_PENDING_SMOKE | Provider readiness route exists. |
| WhatsApp | BLOCKED_IF_CREDENTIALS_MISSING | Draft-only command center exists. |
| Instagram | BLOCKED_IF_CREDENTIALS_MISSING | Draft-only command center exists. |

## Decision

Unified commerce architecture is implemented in code, but certification remains partial until the additive migration is reviewed/deployed and final runtime smoke tests pass.
