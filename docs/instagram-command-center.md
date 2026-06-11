# Instagram Command Center

Date: 2026-06-03

## Status

Status: IMPLEMENTED_AS_BLOCKED_UNTIL_META_READY

Target account: `@salora.cafe`

## Capabilities

| Capability | Status |
| --- | --- |
| Content drafts | IMPLEMENTED |
| AI caption workflow | DRAFT_ONLY |
| Post scheduling metadata | DRAFT_ONLY |
| Approval workflow | IMPLEMENTED as draft record lifecycle |
| Publishing | BLOCKED until Meta Graph credentials validate |

## Required Credentials

- `INSTAGRAM_ACCESS_TOKEN`
- `INSTAGRAM_BUSINESS_ACCOUNT_ID`

Secrets are never displayed in Control Tower.

## API

Route: `/api/control-tower/instagram`

GET returns readiness and target account. POST creates draft-only content records and does not publish.
