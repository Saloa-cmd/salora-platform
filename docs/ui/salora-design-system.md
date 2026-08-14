# SALORA Design System

SALORA is luxury, calm, modern, warm, precise and hospitality-first. It is not a generic SaaS dashboard. Depth comes primarily from surface contrast, borders and spacing; gold is an accent, not a canvas.

## Token architecture

`packages/ui/design-tokens.ts` is the portable source for Web, Expo and future Control Tower components. Primitive colour names describe raw values; components consume semantic roles (`background`, `surface`, `foreground`, `border`, `brand`, `success`, `warning`, `danger`, `info`). Compatibility aliases remain temporarily for incremental migration.

Web exposes matching CSS custom properties in `apps/web/app/globals.css`. Mobile consumes the TypeScript object through `apps/mobile/src/lib/theme.ts`.

## Foundations

- Black: background → interactive → surface → soft → raised.
- Gold: primary action, selection and premium highlight only. Avoid long gold text.
- Typography: Arabic and Latin system stacks remain until licensing and font delivery are approved. Numeric/price is a distinct token role.
- Spacing: 4px base scale from 0 to 96.
- Radius: control 12, card 18, elevated/modal 24, pill only for compact labels.
- Elevation: restrained soft/raised shadows; borders and surface steps take priority.
- Breakpoints: 320, 430, 768, 1024, 1280 and 1536.
- Motion: 120/180/280ms and two calm easing curves. Reduced motion is mandatory.
- Touch targets: 44px minimum.

## RTL and language

Use logical CSS (`margin-inline`, `padding-inline`, `inset-inline-start/end`, `border-inline-*`). Direction belongs at the nearest language root. Directional icons must be mirrored deliberately; universal icons must not. Prices should isolate numeric text with `dir="ltr"` when embedded in Arabic copy.

## Primitive guidelines

### Button and icon button

Use for immediate actions. Variants are primary, secondary, outline, ghost and destructive; sizes are small, medium and large. Loading sets `aria-busy` and disables repeated submission. Icon-only buttons require the `label` prop. Do not use a button for navigation.

### Field

Use when a native text input needs a visible label, optional description and associated error. The error is announced and `aria-invalid` reflects state. Do not place business copy inside the primitive.

### Badge

Use for compact status or metadata. Tones are neutral, brand, success, warning, danger and info. Do not use a badge as an unlabeled interactive control.

### Alert

Use inline for durable feedback. Danger uses an alert role; informative feedback uses status. Do not replace a required confirmation with a toast.

### Skeleton

Use only when layout is predictable. Animation respects reduced motion. Do not show an indefinite skeleton after a known error.

### Empty state

Compose title, description and optional actions from translations. Use for a valid zero-result state; use an error state for failed retrieval.

### Table region

Wrap wide semantic tables to provide labelled keyboard-accessible overflow. It is not a data-grid abstraction and does not add fake keyboard interaction.

## Accessibility contract

Target WCAG 2.2 AA: semantic HTML, visible focus, accessible names, associated errors, genuine disabled semantics, 44px targets, keyboard operation and reduced motion. Dialog focus management must use a proven implementation or complete tests before adoption.

## Anti-patterns

- Hex values inside new components.
- Physical left/right spacing for directional layout.
- Icon-only buttons without names.
- Gold backgrounds over large regions, neon effects, excessive blur or glassmorphism.
- A second translation, theme or component system.
- Sharing Web component implementations with React Native when only tokens should be shared.
