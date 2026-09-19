# SALORA Design System 3.0

Status: UX-01 foundation. This document defines the shared system; route redesigns remain outside this change.

## One system, two personalities

Customer surfaces are cinematic, sensory, spacious, image-led, and intentionally sparse. Operator surfaces are calm, compact when necessary, keyboard-friendly, and decision-oriented. Both use the same semantic color, type, space, focus, motion, and state contracts. Personality is expressed through composition and density, not a forked token set.

## Source of truth

- `apps/web/styles/tokens.css`: primitive and semantic CSS tokens, themes, Arabic composition, reduced motion.
- `apps/web/lib/design-system/tokens.ts`: typed values for JavaScript APIs that cannot consume CSS variables.
- `apps/web/styles/primitives.css`: accessible styling contract for shared primitives.
- `apps/web/components/ui/SaloraPrimitives.tsx`: semantic React primitives.
- `apps/web/tailwind.config.ts`: compatibility aliases referencing the token layer.

New UI must consume semantic roles such as `--color-text`, `--color-surface`, or `--motion-normal`. Palette primitives such as `--salora-gold-500` are reserved for the token layer. Existing names such as `--gold` remain compatibility aliases until route-level migrations are separately reviewed and certified.

## Color

Matte black and warm ivory carry most of the visual weight. Gold communicates brand emphasis, selection, premium detail, and focused moments; it is not a default border or heading color. Status colors communicate state and never replace a text or icon label.

Both dark and light themes preserve semantic roles. A component must not infer a theme from a raw color value.

## Typography

The available semantic roles are Display, Hero, H1, H2, H3, Title, Body, Body Small, Caption, Label, Price, Metric, and Button. Latin uses Manrope and Arabic uses Noto Sans Arabic, both self-hosted by `next/font` at build time with `display: swap` and stable CSS variables.

Arabic line height and tracking are independent overrides under `:lang(ar)`. Do not mirror Latin letter spacing into Arabic. Prices pair the numeric value with an explicit OMR label, and mixed Arabic/English content must keep the outer document direction while applying `dir="ltr"` only to genuinely directional fragments.

## Space, layout, and shape

Use the 4px-derived spacing scale and the semantic `--space-section` / `--space-page-inline` tokens. Reading, content, and wide containers are 42rem, 80rem, and 96rem. Responsive media queries use the typed breakpoints in `tokens.ts` because custom properties cannot be used in media query conditions.

Controls use at least `--touch-target-min` (44px). Radius communicates hierarchy: controls are smaller, cards are medium, and overlays are largest. Pills are reserved for compact filters, badges, and segmented state.

## Motion

| Role | Token | Duration | Use |
|---|---|---:|---|
| Fast | `--motion-fast` | 140ms | button, toggle, hover/focus feedback |
| Normal | `--motion-normal` | 220ms | card, drawer, filter, bottom sheet |
| Cinematic | `--motion-cinematic` | 560ms | hero, story, signature reveal |

Motion explains state, hierarchy, or continuity. With `prefers-reduced-motion: reduce`, all three roles collapse to 1ms and animated primitives stop. Content and actions remain complete without animation.

## Focus and interaction states

All native controls and focusable regions receive a high-contrast, 2px focus ring with a 3px offset. Components may not remove the outline unless they replace it with an equally visible system focus treatment. Hover is supplemental; no action may require hover. Disabled state uses semantic opacity and remains programmatically disabled.

## Core primitive contract

- `SaloraButton`: explicit variant, size, busy state, and disabled behavior.
- `SaloraIconButton`: requires an accessible label and defaults to `type="button"`.
- `SaloraBadge`: semantic status tone; never conveys state by color alone.
- `SaloraField`: bound label, optional description, error announcement, and `aria-invalid`.
- `SaloraAlert`: status or alert semantics according to urgency.
- `SaloraSkeleton`: decorative and removed from the accessibility tree.
- `SaloraEmptyState`: title, explanation, and optional recovery actions.
- `SaloraTableRegion`: named, keyboard-focusable overflow region.

## Usage boundaries

- Customer and operator routes may vary density and composition, not token meaning.
- Directional icons use `.salora-icon-directional`; symmetric icons are never mirrored blindly.
- Do not add page-local magic colors, duration values, or z-index values.
- New dependencies require an activity, license, bundle, accessibility, SSR/RSC, and necessity review. UX-01 adds none.
- Visual concepts in `docs/experience-3/concepts` are directional only. They contain no authoritative product, price, schedule, reward, or operational data.
