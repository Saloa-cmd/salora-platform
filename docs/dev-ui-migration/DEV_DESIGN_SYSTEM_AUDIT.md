# DEV Design System Audit

## Current Design System Surface

DEV has two parallel design systems:

1. Application-level Tailwind/glass UI in `src/index.css` and component class names.
2. Package-style shared tokens and primitives in `design-system/**`.

The application UI is visually stronger and more complete. The `design-system` package is better structured but less aligned with the actual command-center UI.

## Tailwind and Styling

| Area | Finding | SALORA recommendation |
|---|---|---|
| Tailwind | Uses `@import "tailwindcss"` with Tailwind v4 alpha dependency. | Standardize on SALORA's chosen Tailwind version before migration. If SALORA is v3, port classes carefully. |
| Utility style | Heavy use of inline Tailwind classes, arbitrary values, dark surfaces, gold accents, glass panels. | Extract stable dashboard primitives: panel, card, badge, sidebar item, toolbar, tab, table, ticker. |
| CSS utilities | `glass-panel`, `glass-panel-heavy`, `glass-card`, `gold-gradient-text`, `ambient-orb`, custom scrollbars. | Adopt `glass-panel`, `glass-card`, `gold-gradient-text` as SALORA executive utilities after accessibility review. |
| Motion | `animate-pulse`, custom `ambientGlow`, `scanline`, `holographicPulse`, `marquee`, transitions. | Keep subtle state motion; reduce ambient decorative motion in production dashboards. |

## Design Tokens

Application CSS tokens:

- `--gold-primary: #dfba6b`
- `--gold-secondary: #cda34b`
- `--gold-dark: #816223`
- `--obsidian-dark: #050505`
- `--obsidian-med: #0f0f11`
- `--obsidian-light: #16161a`

Package tokens:

- Brand: `#B68D40`, `#302B2B`, `#D7B06E`
- Neutral: `#050505`, `#0D0B10`, `#18161D`, `#2B2730`, `#E8E2D2`
- Status: success, warning, info, error
- Radius: currently `6px`, `12px`, `18px`, `28px`, pill

Mobile tokens:

- `black`, `panel`, `elevated`, `line`, `gold`, `amber`, `cream`, `muted`, `danger`, `success`
- Mobile radii: `8`, `14`, `20`

Recommendation: SALORA Standard UI should reconcile these into one token set with semantic names:

- `surface.base`, `surface.panel`, `surface.elevated`
- `border.subtle`, `border.gold`
- `text.primary`, `text.secondary`, `text.muted`, `text.gold`
- `brand.gold`, `brand.goldHover`, `brand.bronze`
- `status.success`, `status.warning`, `status.error`, `status.info`

## Typography

Current app imports Cairo, Alexandria, and IBM Plex Sans Arabic, but body also references `Plus Jakarta Sans` and `Noto Kufi Arabic` without corresponding imports in `src/index.css`. The design-system package uses Inter.

SALORA Standard UI recommendation:

- Body: keep one Latin/Arabic compatible UI stack.
- Arabic: Cairo or IBM Plex Sans Arabic.
- Display: avoid relying on undefined `font-cinzel` unless SALORA explicitly loads Cinzel.
- Mono: keep for telemetry, IDs, metrics, and operational labels.
- Fix encoding artifacts in Arabic strings before making the system canonical.

## shadcn

No `components.json` or shadcn component structure was found. DEV uses custom Tailwind components, not shadcn/ui. If SALORA uses shadcn, DEV patterns should be reimplemented as shadcn-compatible primitives rather than copied.

Suggested shadcn mapping:

- `glass-panel` -> `Card` variant `executive`
- tabs -> `Tabs`
- database table -> `Table`
- dialogs -> `Dialog`
- sliders -> `Slider`
- select controls -> `Select`
- toggles -> `Switch`
- toast/sound notifications -> `Toast`

## Charting System

DEV uses Recharts:

- `AreaChart`, `Area`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer`
- `PieChart`, `Pie`, `Cell`

SALORA Standard UI should keep Recharts for Wave 1 and Wave 2 because it is already integrated and sufficient for executive dashboards. Create wrappers:

- `ExecutiveAreaChart`
- `RevenueTrendChart`
- `ProductMixDonut`
- `OperationalLatencyChart`

## Mobile Components

Mobile workspace uses Expo Router, NativeWind, Zustand, React Query, Sentry, and reusable primitives:

- `mobile/components/Button.tsx`
- `mobile/components/ProductCard.tsx`
- `mobile/components/Screen.tsx`
- `mobile/components/SectionHeader.tsx`
- `mobile/components/TextField.tsx`

The dashboard's phone simulator is web-only and should not be confused with the production Expo app. Reuse the simulator as an executive preview surface; reuse the mobile primitives for actual mobile UI.

## Glassmorphism

Glassmorphism is the signature executive visual language: dark obsidian surfaces, translucent panels, gold borders, soft glows, gradient gold text.

SALORA Standard UI should adopt it with guardrails:

- Use glass panels for high-value dashboard cards and modal surfaces.
- Avoid ambient orbs as a default production background.
- Preserve contrast for small telemetry text.
- Use consistent radii. Current project often uses `rounded-xl` and `rounded-2xl`, while standards prefer tighter cards for operational tools. For SALORA executive dashboards, use 8-12px for dense cards and 16px max for major containers.

## What Should Become SALORA Standard UI

Immediate standards:

- Executive shell: dark background, gold telemetry ribbon, left navigation, role/clearance chip.
- Metric cards with icon well, label, value, change indicator.
- Glass panel utility with tokenized colors.
- Recharts wrappers with gold/emerald/chart palette.
- Operational feed rows for audit logs, orders, telemetry, and tests.
- AI control panel primitives: prompt preset card, output canvas, tone sliders.
- Admin table shell: table tabs, search, role gate, snapshot actions.
- Mobile simulator frame as an executive preview component.

Do not standardize yet:

- Hard-coded Arabic strings with encoding artifacts.
- Decorative emoji-heavy labels.
- Direct Unsplash image dependencies.
- Tailwind v4 alpha as a default if SALORA has not committed to it.
