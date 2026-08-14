# P23 UI/UX Audit

Baseline: `main` at `2161e5be4860e9788af0f912ad96c37ab68debdd` (14 August 2026). This audit is repository-based; Core Web Vitals are not claimed without production-quality field or lab measurements.

## Executive summary

SALORA already has a recognisable black/gold visual language and partial shared tokens, but the implementation is split between `@salora/config`, `@salora/ui`, Tailwind configuration, global CSS and screen-local values. Web has 64 native button and 35 native input occurrences, while the shared primitive layer contains only a small subset of required controls. The result is avoidable visual drift, inconsistent states and incomplete RTL/accessibility guarantees.

The P23 foundation should consolidate semantic design decisions without redesigning Homepage, Menu, Mobile or Control Tower. No data or runtime authority work belongs in this phase.

## Existing architecture

- Monorepo: pnpm 11, Node 22, TypeScript.
- Web: Next.js 16 App Router, React 19, Tailwind 3, global CSS, Lucide and Framer Motion.
- Mobile: Expo 54, React Native 0.81, Expo Router; tokens consumed through `@salora/ui`.
- Shared UI: `packages/ui` exports tokens and class recipes; concrete web primitives remain under `apps/web/components/ui`.
- No Radix or shadcn dependency is installed. Adding either now would create a second component architecture and is deferred until a concrete dialog/sheet need justifies it.
- Testing: TypeScript, ESLint, Node contract tests and Playwright smoke coverage. No component renderer or axe dependency is present.

## Page inventory

| Surface | Routes/screens found | State coverage |
|---|---|---|
| Public web | `/`, `/menu`, `/login` | Menu has loading/error; global error exists; no shared offline state |
| Dashboard | overview, AI, customers, operations, revenue, WhatsApp | Many local card/control implementations |
| Control Tower | root and dynamic section routes | Broad operator surface; mixed logical and physical positioning |
| Mobile | home, menu, product, cart, checkout, confirmation, offers, loyalty, profile, concierge, executive | Platform components exist; explicit offline/partial-data patterns are incomplete |

## Component inventory

| Family | Current state | Consolidation candidate |
|---|---|---|
| Buttons | Shared `SaloraButton`, mobile `Button`, and many local buttons | P0: semantic variants, size, loading and icon-button contract |
| Inputs/forms | Mostly screen-local Tailwind | P0: labelled field/error contract; later Select/Textarea/choice controls |
| Badges/cards | Several dashboard/control-tower variants | P1: shared semantic status and surface APIs |
| Dialog/drawer/sheet | Menu and Control Tower local implementations | P0 accessibility review; defer shared focus-management dependency decision |
| Loading/empty/error | Partial shared empty state and route-local states | P1: reusable state composition and non-disruptive skeleton |
| Tables | Operator-specific markup | P1: accessible overflow region; full data grid deferred |
| Navigation | Separate public/dashboard/control-tower/mobile implementations | P1 naming/state contract; no redesign in Foundation |

## Visual consistency

- Brand hex values are duplicated in tokens, config, Tailwind, global CSS and screens.
- Black hierarchy exists but is not consistently semantic.
- Gold is generally restrained, but some controls use gradients/glows as one-offs.
- Radius values range from 8px through large pills without a semantic rule.
- Fonts are system-stack declarations; no repository-owned Arabic/Latin font assets were found.
- `OMR` numeric typography has no explicit shared style.

## Responsive findings

- Global containers and horizontal strips are sound foundations.
- 320px is not explicitly represented in Playwright projects.
- Large drawers and bottom sheets require focused overflow/safe-area verification.
- A number of fixed widths and large max-heights need visual certification, not blind refactoring.

## RTL findings

- Language toggles exist in Menu and Control Tower, but root `<html>` is statically `lang="en"` and has no central direction policy.
- Global CSS contained physical `left/right` and `margin-right`; foundation converts safe cases to logical properties.
- Control Tower and Menu intentionally branch drawer edges by language; these require behavioral tests before consolidation.
- Icons, pagination, breadcrumbs and tabs lack one shared mirroring contract.

## Accessibility findings

- Positive: skip link, visible focus, 44px target rule and reduced-motion CSS exist.
- P0: icon-only buttons cannot be assumed to have accessible names across local implementations.
- P0: bespoke dialogs/sheets need focus trap, Escape and focus restoration certification.
- P1: form labels/errors are inconsistent; disabled/loading semantics vary.
- P1: horizontal tables need labelled keyboard-focusable regions.
- Contrast requires rendered verification; no unsupported compliance claim is made.

## Performance findings

- Many UI surfaces are client components; scope-specific hydration review is needed in later experience PRs.
- Framer Motion is already present; no new animation dependency is introduced.
- Shared tokens and primitives add no runtime dependency.
- Image and bundle measurements are deferred until a reliable preview is available.

## UX state findings

Menu has explicit loading and error routes, but consistent empty/retry/offline/partial/missing-image patterns are not platform-wide. Foundation adds composable primitives; commercial copy remains owned by consuming screens/i18n.

## Duplication and risks

The main risk is a mass migration that silently changes high-value journeys. Adoption must be incremental. The second risk is pretending Web and React Native can share implementation; P23 shares semantic tokens and state names while keeping platform renderers separate.

## Priorities

- P0 (6): semantic token source, accessible button/icon contract, labelled form errors, dialog/sheet keyboard audit, central RTL policy, 320px overflow coverage.
- P1 (7): badge/state semantics, tables, Select/Textarea/choices, navigation state, typography/OMR, offline/partial states, visual regression harness.
- P2 (4): font asset decision, motion polish, richer elevation, optional Storybook.

## Recommended PR sequence

1. P23 UI Foundation — tokens and accessible primitives.
2. P23 Menu Experience — bilingual responsive menu.
3. P23 Public Experience — homepage and navigation.
4. P23 Mobile Experience — parity and offline states.
5. P23 Control Tower — operator experience.
6. P23 UI Quality — accessibility, performance and visual regression.
