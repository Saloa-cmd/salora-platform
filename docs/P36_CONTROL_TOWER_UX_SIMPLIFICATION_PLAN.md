# SALORA P36 — Control Tower UX Simplification

## Objective
Turn the existing Control Tower into a faster, calmer operations surface for a 117-product live catalog without replacing the working architecture.

## Production baseline
- Production deployment remains unchanged during P36 preview work.
- Baseline main SHA: `4e6cd7bc6ab232059c535bcace98918baa481803`.
- Catalog baseline: 117 active SALORA products.
- Runtime baseline: Vercel production currently reports no runtime errors in the latest 24-hour check.

## UX direction
1. Keep the current five navigation groups: Overview, Experience, Commerce, Growth, Operations.
2. Reduce cognitive load inside the Menu workspace by promoting readiness, search, filters and primary actions before secondary governance detail.
3. Make catalog health scannable: Active, Draft, Order Ready, Media Ready, Activation Ready.
4. Add a clear success state for a fully-ready catalog instead of presenting activation controls as the dominant action when there is nothing left to activate.
5. Keep Command Palette and Copilot as accelerators, not as parallel navigation systems.
6. Preserve Arabic/English, RTL/LTR, dark/light/system themes and current permission boundaries.

## Proposed design system refinements
- Dense operational cards become compact status strips where possible.
- Keep gold for primary operator intent; use semantic emerald/amber/red only for readiness and alerts.
- Use progressive disclosure for nested navigation and governance metadata.
- Use sticky filtering/search controls for large product tables.
- Improve mobile product management by switching from wide tables to stacked product cards below tablet breakpoint in a later P36 iteration.

## Guardrails
- No direct browser-to-database access.
- No service-role exposure.
- No production schema migration in this UI phase.
- No production deployment or merge as part of initial P36 implementation.
- Existing server-side readiness checks remain authoritative.

## Next implementation slices
### Slice A — Catalog completion state
- Promote 117/117 readiness as an explicit completion state.
- Hide or de-emphasize bulk activation when candidate count is zero.
- Surface "catalog fully order-ready" with a concise operator action path.

### Slice B — Product operations
- Add quick row actions: edit, media, availability, preview.
- Add saved filters and compact density toggle.
- Add mobile card layout.

### Slice C — Navigation and command model
- Recent/frequent work shortcuts.
- Context-aware command palette suggestions.
- Breadcrumbs that expose the active sub-workspace without deep menu nesting.

### Slice D — Experience preview
- Split-screen draft vs published preview.
- Desktop/mobile viewport presets.
- Visual change summary before review/publish.

## Separate platform hardening track
Supabase advisor findings should be handled separately from P36 UI work. Current findings include leaked-password protection disabled, informational RLS-without-policy notices on internal/CMS tables, unindexed foreign keys, and several overlapping permissive SELECT policies. These are not mixed into the UX PR because database-policy changes carry different production risk and validation requirements.
