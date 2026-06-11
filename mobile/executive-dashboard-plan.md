# Mobile Executive Dashboard Plan

The repository's production mobile app lives under `apps/mobile`. This file exists at `mobile/executive-dashboard-plan.md` because Phase L requested that exact path.

## Future Expo Screen Mapping

| Web dashboard | Future Expo screen | Mobile treatment |
|---|---|---|
| `/dashboard` | `apps/mobile/app/executive/index.tsx` | Executive KPI stack, alert strip, runtime summary. |
| `/dashboard/revenue` | `apps/mobile/app/executive/revenue.tsx` | Revenue cards, payment health, channel list. |
| `/dashboard/operations` | `apps/mobile/app/executive/operations.tsx` | Order volume, queue health, inventory warnings. |
| `/dashboard/ai` | `apps/mobile/app/executive/ai.tsx` | AI health, provider usage, safety/cost signals. |
| `/dashboard/customers` | `apps/mobile/app/executive/customers.tsx` | Customer health, loyalty engagement, churn risk. |
| `/dashboard/whatsapp` | `apps/mobile/app/executive/whatsapp.tsx` | Channel readiness and empty states until exact metrics exist. |

## Readiness Guidance

- Reuse the web adapter contracts as shared TypeScript types before building native screens.
- Use mobile primitives from `apps/mobile/components`.
- Keep the first mobile wave read-only.
- Preserve RBAC and explicit empty states.
- Do not port DEV's web phone simulator into production Expo screens.
