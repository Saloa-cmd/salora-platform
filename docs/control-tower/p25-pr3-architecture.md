# P25 PR3 Control Tower Architecture

## Jobs and boundaries

PR3 optimizes daily operator jobs: find a domain, understand its state, edit a typed draft, inspect operational data and run an authorized domain action. It does not create a database console, a client-side service role, a new publish path or Production configuration access.

```text
Control Tower UI
  → authenticated route/API
  → strict schema validation
  → current RBAC permission
  → domain/application service
  → RLS-context repository
  → PostgreSQL/Supabase
  → activity and audit records
```

The application shell is route-split under the Control Tower layout, uses the PR2 theme engine and semantic icon registry, supports AR/EN and RTL/LTR, and does not enter Homepage/Menu bundles. The command palette performs permission-scoped navigation and debounced, bounded server search.

## Change decisions

- KEEP: repository/RLS context, domain APIs, existing order/catalog/customer/WhatsApp operations.
- HARDEN: navigation authorization visibility, typed search DTOs, draft audit, explicit Menu Authority warning.
- REFACTOR: Control Tower route taxonomy and monolithic section composition.
- DEPRECATE: Experience v1 authoring and direct `system:write` publication surface.
- REMOVE from PR3 UI: publish and rollback controls.
- DEFER: full asset/brand/navigation persistence, approval/publish/schedule/rollback to PR4.

No Production migration, database write, environment mutation, deploy or merge is part of this implementation task.
