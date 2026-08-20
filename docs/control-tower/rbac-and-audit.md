# Control Tower RBAC and Audit

Current roles are `CUSTOMER`, `STAFF`, `MANAGER` and `ADMIN`; PR3 does not invent or migrate roles. Current capabilities remain authoritative: staff can read orders/catalog/content and update orders; managers add catalog/content write and staff read; administrators have wildcard domain/system permissions.

Authorization is enforced at four layers:

1. Server-generated navigation and commands hide irrelevant workspaces.
2. Page routes reject sections not visible to the actor.
3. API routes require explicit domain permissions and strict schemas.
4. Repository calls execute inside the current Prisma auth/RLS context.

Experience draft saves record actor, entity, timestamp, before/after references, request ID, reason and DRAFT version in the existing activity/audit stores. Search is read-only and does not create audit noise. Logs must not contain tokens, cookies, credentials, authorization headers, payment secrets or raw customer PII.

Negative requirements: unauthenticated access redirects; direct API invocation remains authorized; non-DRAFT experience payloads return conflict; arbitrary table/field/SQL APIs do not exist; browser code never imports privileged database credentials.
