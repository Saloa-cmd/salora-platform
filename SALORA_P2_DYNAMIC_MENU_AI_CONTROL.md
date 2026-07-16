# SALORA P2 — Dynamic Menu and AI Control

## Delivered

- Loads product variants, add-ons, modifier groups, and price deltas from Prisma.
- Normalizes legacy JSON modifier options safely.
- Replaces hard-coded web choices with database-driven option groups while retaining a fallback menu.
- Calculates resolved unit prices and persists structured selections.
- Adds the same dynamic customization flow to the mobile product screen.
- Keeps separately customized mobile cart lines distinct.
- Shows selected options in mobile checkout.
- Adds an AI Control Center to Control Tower with governed capability switches, audit visibility, secret-boundary status, and a review-only product content studio.

## Governance

- AI provider credentials remain server-side.
- Generated product content remains a draft until a human operator approves it.
- AI capabilities use existing feature flags and audit logs.
- This package does not add fake CRUD controls where a protected API does not yet exist.

## Next priority

- Add protected Control Tower CRUD endpoints and forms for variants, modifier groups, options, add-ons, schedules, and branch availability.
- Add AI-assisted bulk catalog enrichment with approval queues and rollback.
- Add end-to-end ordering tests for customized web and mobile cart lines.
