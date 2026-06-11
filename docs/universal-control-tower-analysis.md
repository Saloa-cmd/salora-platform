# Universal Control Tower Analysis

Generated on 2026-05-31 for SALORA Phase 10.

## Current Platform Baseline

SALORA currently includes:

- Executive Command Center routes under `/dashboard/**`.
- Revenue, operations, AI, customer, loyalty, inventory, notification, order, product, auth, payment, WhatsApp webhook, health, metrics, and runtime API surfaces.
- RBAC-protected write APIs for catalog products, inventory movements, loyalty entries, notifications, refunds, and admin checks.
- AI platform primitives for providers, routing, governance, safety, cost control, evaluation, recommendations, and observability.
- Omnichannel primitives for channel registry, WhatsApp provider, webhook parsing/security, idempotency, and metrics.
- Revenue platform primitives for payments, Stripe/mock provider registry, refunds, metrics, and revenue analytics.
- DEV blueprint assets for CommandDeck, analytics widgets, CMS/control-center patterns, and mobile preview concepts.

## Current Executive Command Center

Phase 9 delivered a read-only executive visibility layer:

- `/dashboard`
- `/dashboard/revenue`
- `/dashboard/operations`
- `/dashboard/ai`
- `/dashboard/customers`
- `/dashboard/whatsapp`

It uses SALORA intelligence APIs, preserves RBAC, and renders explicit empty states where exact metrics do not exist.

## Remaining Manual Operations

- Product and menu updates still require API calls or code-assisted operation unless exposed through an admin UI.
- Pricing, offers, promotions, banners, landing pages, and homepage layout do not have a persistent CMS UI.
- AI provider/model routing exists in code architecture but is not owner-editable through a no-code screen.
- WhatsApp templates, flows, broadcasts, and assistant behavior are not manageable from a dashboard.
- Automation rules are not persisted as trigger-condition-action definitions.
- Integrations are implemented as provider modules but lack a registry UI, credential vault UX, and health dashboard.
- Multi-brand business selection and tenant-scoped configuration are not yet modeled in the web UI.
- Approval workflows, rollback, change history, and audit review are not yet first-class admin screens.

## Remaining Code-Dependent Operations

- Website content and homepage structure.
- Mobile app content and navigation.
- Theme, typography, feature flags, and runtime app configuration.
- AI prompt templates, safety policy tuning, provider fallback rules, and cost limits.
- WhatsApp conversation flows, auto replies, and broadcast templates.
- Campaign creation, scheduling, and lifecycle management.
- Integration activation for OpenAI, Gemini, Claude, Stripe, WhatsApp, Firebase, Google Analytics, Meta, and future systems.
- Tenant onboarding for future cafes, brands, and restaurants.

## Missing Admin Capabilities

- Super Admin Control Tower with sections for Executive, Revenue, Orders, Inventory, Customers, Loyalty, AI, WhatsApp, Notifications, Content, Automation, Integrations, and Settings.
- Unified permission matrix and role-based action visibility.
- Audit trail viewer for all admin changes.
- Approval workflows for risky changes such as pricing, offers, AI safety, provider credentials, and broadcast campaigns.
- Version history and rollback for CMS, app config, AI config, and automation rules.

## Missing CMS Capabilities

- Page, section, banner, promotion, menu, category, product, and landing-page editors.
- Draft, publish, schedule, and archive lifecycle.
- Runtime website/mobile content delivery API.
- Versioned content records with approver metadata.
- Preview mode for website and mobile app content.

## Missing Automation Capabilities

- Trigger registry, condition builder, and action registry.
- Visual trigger-condition-action builder.
- Dry-run simulator and audit preview.
- Runtime execution engine with retry, idempotency, and dead-letter visibility.
- Built-in recipes:
  - Order Paid -> Loyalty Award.
  - Customer Inactive -> Offer Campaign.
  - Payment Failed -> WhatsApp Reminder.

## Missing Integration Capabilities

- Connector registry UI.
- Credential vault UX that never exposes secret values.
- Connector health monitor.
- Provider activation workflow for OpenAI, Gemini, Claude, Stripe, WhatsApp, Firebase, Google Analytics, Meta, and future systems.
- Pluggable connector metadata contract.

## Implementation Direction

Phase 10 should create the Universal Control Tower as a management plane, not another analytics-only dashboard.

Safe immediate implementation:

- Add `/control-tower` route family.
- Create a Super Admin shell with all required sections.
- Add typed section registry and capability cards.
- Enable no-code forms for existing safe write APIs:
  - Product creation.
  - Inventory movement.
  - Loyalty entry.
  - Notification queueing.
- Add typed workspaces for CMS, app configuration, AI control, WhatsApp operations, automation, integrations, tenants, analytics, governance, and settings.
- Mark non-persistent capabilities as `Needs backend activation` rather than pretending they are live.

Later backend activation:

- Persistent CMS domain.
- Runtime app configuration domain.
- AI control policy domain.
- WhatsApp operations domain.
- Automation engine domain.
- Integration registry and credential vault domain.
- Multi-tenant business domain.
- Audit/change-history/approval workflow domain.

## Production Guardrails

- Preserve RBAC on all writes.
- Surface forbidden/unauthorized states.
- Do not store secrets in browser state.
- Do not report inactive integrations as healthy.
- Do not invent production metrics where APIs do not exist.
- Keep first-wave actions explicit and auditable through existing request IDs.
