# SALORA P7 — Unified Experience System

P7 establishes a shared experience foundation for the Control Tower, public menu, and mobile app without changing the existing Supabase data model or the P6 publishing workflow.

## Delivered

- Semantic icon adapters for web and mobile, so business actions use one stable vocabulary while each platform renders an appropriate icon set.
- Full logical-direction support for Arabic and English, including mobile navigation, drawers, category strips, and action placement.
- WCAG 2.2-oriented interaction defaults: visible focus, 44px touch targets, reduced-motion support, forced-color borders, semantic tabs, live result counts, and labelled dialogs/search.
- Responsive Control Tower navigation with a real mobile drawer and a calmer action hierarchy.
- A denser menu hero that moves products above the fold, hides platform scrollbars, adds category snap scrolling, result feedback, empty states, and filter reset.
- Mobile menu search and category navigation with accessible icons and state announcements.
- Central design tokens for focus, status, radii, elevation, safe-area spacing, glass surfaces, and scroll strips.

## Architectural rules

1. Icons are selected by meaning, never by screen-specific glyph names.
2. Arabic uses `dir=rtl`; layout uses logical properties (`start`, `end`, `margin-inline`) rather than mirrored hard-coded positions.
3. Public experience settings remain configuration-as-data and continue to be published from the P6 Experience Studio.
4. Server Components remain the default; client code is limited to interaction and persisted locale state.
5. Every unavailable capability remains visibly labelled instead of appearing production-ready.

## Next controlled releases

- P8: complete component library, typography assets, contrast regression tests, and Storybook-grade documentation.
- P9: expand no-code content schemas for pages, navigation, reusable sections, campaigns, and approval workflows.
- P10: governed AI media pipeline for product images with human approval, storage, provenance, and rollback.
- P11: operational analytics, performance budgets, event taxonomy, experimentation, and release observability.

## Acceptance checks

- Web and mobile TypeScript checks pass.
- Full repository test suite passes.
- Production build passes under Node 22.
- Arabic and English keyboard flows are reviewed at mobile, tablet, and desktop widths.
- No database migration or production secret is introduced by P7.
