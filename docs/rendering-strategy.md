# SALORA Rendering Strategy

Date: 2026-06-01

## Principle

Only truly static pages should remain static. Operational dashboards, control planes, RBAC-protected views, and runtime data views must render dynamically.

## Route Classification

| Route | Strategy | Reason |
|---|---|---|
| `/` | Static | Public marketing/home surface. |
| `/robots.txt` | Static | Search crawler metadata. |
| `/sitemap.xml` | Static | Site metadata. |
| `/dashboard` | Dynamic | RBAC/data/runtime operational dashboard. |
| `/dashboard/revenue` | Dynamic | Revenue runtime data. |
| `/dashboard/operations` | Dynamic | Operations runtime data. |
| `/dashboard/ai` | Dynamic | AI runtime data. |
| `/dashboard/customers` | Dynamic | Customer/runtime intelligence. |
| `/dashboard/whatsapp` | Dynamic | Channel runtime readiness. |
| `/control-tower` | Dynamic | Admin management plane. |
| `/control-tower/[section]` | Dynamic | Section-specific management plane; must not SSG every section. |
| `/api/**` | Dynamic | Runtime API behavior. |

## ISR Candidates

Future ISR candidates:

- Public menu pages.
- Published CMS landing pages.
- Public campaign pages.

Not ISR candidates:

- Admin dashboards.
- Control Tower pages.
- Authenticated analytics.
- Tenant-specific operational state.

## Build Guardrail

No operational route should export `generateStaticParams` unless it is public, finite, low-cost, and independent from RBAC/runtime data.
