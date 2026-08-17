# P25 PR2 — Theme & Icon Infrastructure

Baseline: PR #48 head `0bb3ea5da60311bcb70bd204a94f4dd24c881bf1`.

## Contract

`packages/ui/design-tokens.ts` is the canonical semantic theme source. It defines `dark` and `light`; `system` is a preference resolved by each platform adapter. Dark remains the compatibility default. Gold, espresso and cream preserve the SALORA identity while foreground, surfaces, borders, status and focus values adapt for contrast.

Web uses CSS custom properties on `html[data-theme]`. The server reads the non-sensitive `salora_theme` cookie and emits a deterministic initial theme. A nonce-protected bootstrap resolves `system` before paint, using versioned local storage only as fallback. The accessible control cycles `dark → light → system`, persists preference, and follows OS changes only in system mode.

Mobile uses the same semantic names through `mobileThemes`, `Appearance`, and AsyncStorage. `SaloraThemeProvider` owns preference; navigation chrome and the profile appearance control consume it. Legacy static StyleSheets retain the dark compatibility snapshot until migrated through shared primitives.

## Icon language

Lucide is the curated Web implementation and Ionicons the native adapter. `saloraIconMetadata` owns semantic names, bilingual labels, categories, keywords, directional behavior, platforms and approved sizes. Decorative icons are hidden; meaningful standalone icons require labels. Directional icons mirror in RTL.

## Boundaries and verification

- Homepage, Digital Menu and Control Tower expose the same Web control.
- Experience v2 restricts icon keys and theme modes to allowlisted values.
- Menu Authority, publication, schemas, API routes, environments and secrets are unchanged.
- Figma was inspected read-only; the connected seat is View.
- Run `pnpm test:p25-theme-icons`, Web/Mobile typechecks, lint, build, full tests and Playwright.
- Visual matrix: Dark/LTR, Light/LTR, Dark/RTL and Light/RTL on mobile, tablet and desktop.

PR3 may consume these contracts in the Control Tower Experience Studio. It must not add arbitrary CSS/HTML or a second theme authority.
