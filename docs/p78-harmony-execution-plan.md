# SALORA P78 — Harmony Execution Plan

Status: IN PROGRESS
Base: `main@31ad591d18c16272fc89e34ac76a1fa1529ecdf7`
Branch: `agent/p78-harmony-foundation`

## Architecture decision

SALORA PostgreSQL remains the system of record. Existing customer, order, loyalty, reward, notification, audit, AI, Redis/BullMQ, auth/RBAC and Control Tower boundaries are reused. P78 does not introduce a second loyalty database, external CRM, external loyalty SaaS, another queue, or a new microservice boundary.

## P78-A — Persistent Loyalty Core

Goal: remove in-memory loyalty as an authority and make PostgreSQL transactions authoritative.

Required implementation:
- Repository-backed loyalty account and immutable ledger operations.
- Idempotent earn/redeem/adjust/expire/reverse semantics.
- Atomic account balance + ledger mutation.
- Order/payment correlation and duplicate-award protection.
- Configurable reward/rules boundary; no hard-coded amount-to-points rule in payment orchestration.
- Existing auth/RBAC/RLS and audit boundaries remain authoritative.
- Covering indexes for loyalty ledger/redemption foreign keys where query plans require them.
- Unit/integration tests including retry, duplicate event, refund/reversal and concurrency cases.

Gate A: schema/migration review -> staging migration -> tests -> Preview runtime verification. No Production data migration or merge before the gate passes.

## P78-B — Customer Intelligence

Goal: deterministic customer intelligence from first-party commerce data before AI interpretation.

Build RFM, repeat rate, spend, visit cadence, product/category affinity, loyalty engagement, churn-risk signals and explainable segments. AI may summarize or suggest actions but must not be the source of customer facts.

Gate B: query correctness, privacy/minimization, performance and empty/sparse-data behavior.

## P78-C — Harmony Control Tower

Goal: operator-first customer and loyalty command center.

Provide customer search/detail, account balance, ledger timeline, rewards/redemptions, segments, anomalies and governed manual adjustments. All mutations use authenticated server boundaries, permissions, validation, audit logs, confirmation and idempotency. AR/EN, RTL/LTR and existing SALORA design tokens are reused.

Gate C: role matrix, accessibility, mobile/desktop, audit and end-to-end Preview verification.

## P78-D — Journeys / Automation

Goal: event-driven retention journeys without autonomous external publishing.

Reuse domain events and Redis/BullMQ for asynchronous work. Long-running wait/condition/approval orchestration may be added only where BullMQ is not the correct primitive. Campaign/reward actions that reach external channels require explicit human approval. Feature flags and kill switches are mandatory.

Gate D: retry/idempotency, consent, rate limits, human approval, observability and rollback verification.

## Non-goals

- Apple/Google Wallet in P78 core.
- New CRM or loyalty vendor.
- New queue technology while Redis/BullMQ remains sufficient.
- Blockchain/NFT loyalty.
- Data warehouse or vector database before production data volume justifies it.
- Client-side direct database writes for privileged loyalty operations.

## Release policy

Each phase lands behind tests and feature gates. Staging/Preview precede Production. Production migrations, merge and activation remain separate release decisions after CI and operational verification.