# Admin Governance

## Required Controls

- RBAC.
- Permission matrix.
- Audit trail.
- Approval workflows.
- Secrets management.
- Change history.
- Rollback.

## Current State

RBAC and permission checks already protect existing write APIs. The Control Tower uses those APIs and surfaces forbidden responses.

## Activation Requirements

- Admin action audit table.
- Change-set model.
- Approval policy model.
- Version history per managed resource.
- Rollback execution.
- Secret vault provider and rotation log.
