# SALORA Experience 3.0 — UX-00 Baseline

Date: 2026-09-19  
Evidence sources: GitHub, Vercel, Supabase production (read-only), live HTTP responses, connected-browser DOM inspection, and repository inspection.

## Release isolation

| Item | Verified state |
| --- | --- |
| `main` | `464307e0bbe790eb6f33793ac4b663b0a3fd7078` |
| GitHub CI/status on `main` | Vercel status `success` |
| Production deployment | `dpl_Fm4XP9G7rS68YnBGM63SSm2T73bq`, `READY`, target `production` |
| Production SHA | `464307e0bbe790eb6f33793ac4b663b0a3fd7078` |
| Harmony PR #89 | Open, Draft, not merged |
| Harmony certified RC | `59dceb9c6173922a9cad4047e27e023d07dbd488` |
| Experience branch | `feature/experience-3-ux01-design-system`, created from verified `main` SHA |

PR #89 remains isolated. No Experience 3.0 changes are based on, added to, or written into its branch or certified RC.

## Production data authority

The production database was queried with read-only `SELECT` statements. No schema, data, storage, publication, or policy mutation was performed.

| Invariant | Result |
| --- | ---: |
| SALORA catalog products | 139 |
| ACTIVE products | 139 |
| Invalid/zero prices | 0 |
| Live product images | 139 |
| Primary images | 139 |
| Menu collection | `PUBLISHED` |
| Active revision | v3, `PUBLISHED` |
| Revision products | 139 |
| Revision checksum | `4be463aeaafef58a2ec4fafc9a80c76102718eede5ae3b35434c754d142fe909` |
| Latest publication | `PUBLISHED`, 2026-09-12 10:11:02 UTC |

Supabase reports RLS enabled on all listed `public` tables. The current security advisor reports three informational `rls_enabled_no_policy` findings (`_prisma_migrations`, `cms_approvals`, and `cms_revisions`). These are recorded risks; UX-01 does not alter database policy.

## Current application architecture

### Customer surfaces

- `/` is a server page that reads the published menu and Experience configuration, selects six products, then hands the complete visible experience to the client component `PremiumHomeExperience`.
- `/menu` is a server page that reads Menu Authority, then serializes all products and sections into the client component `MenuExperience`.
- `MenuExperience` owns language, service mode, category, search, product sheet, modifiers, cart, and checkout state in one 671-line client island.
- Product images use `next/image`; the public menu is sourced from the immutable published revision with live status/image overlays.
- The current quick view is an accessible dialog in the same client tree, but canonical per-product routes do not yet exist.

### Operator surfaces

- `/control-tower` and `/control-tower/[section]` enforce page authentication and server-side role filtering before rendering the client shell.
- `ControlTowerShell` contains navigation, locale/theme controls, a permission-filtered command palette, and responsive mobile navigation.
- `ControlTowerView` imports most operator workspaces eagerly into one client boundary.
- The canonical registry has 11 sections. The IA is consolidated at the route level, but several sections still compose older dashboard adapters and P36-era workspaces.
- `/dashboard/*` remains a separate legacy surface and duplicates concepts now available in Control Tower.

### Data loading and publication

- `getMenuAuthoritySnapshot()` reads the active immutable revision, verifies the revision contract, overlays current ACTIVE status and media, filters availability, caches the result for five minutes, and retains a last-known-good snapshot.
- `/api/v1/menu-authority` exposes the current revision and checksum; the live response payload is 168,576 bytes.
- Experience publication is not yet a complete governed publication lifecycle. The current API explicitly reports `publicationAuthority: "NONE_PR3"`.
- The P36 activation path and 117/v2 compatibility artifacts still exist in code even though production is at 139/v3. They must be retired in a later, isolated phase after Experience 3.0 is stable.

## Live payload and DOM baseline

Measurements are uncompressed response/body bytes and fetched initial script bytes from the public production deployment. Browser counts are from the rendered desktop DOM at 1363 × 936.

| Route | HTML | Initial JS | Images | Other evidence |
| --- | ---: | ---: | ---: | --- |
| `/` | 49,774 B | 1,016,408 B | 9 | DOM height 4,058 px |
| `/menu` | 868,665 B | 1,049,549 B | 144 | 142 product cards, 315 buttons, DOM height 27,825 px |
| `/control-tower` | 11,588 B | 931,550 B | 0 | Correctly redirects unauthenticated users to login |
| `/api/v1/menu-authority` | 168,576 B | — | — | Revision-backed JSON |

The menu exceeds the Experience 3.0 HTML budget by roughly 3.5× and initial JS budget by roughly 3×. The primary cause is architectural: all 139 products, their media, modifier data, and UI are serialized/rendered on first load.

## Accessibility and RTL baseline

Browser DOM inspection found:

- `html[lang="ar"][dir="rtl"]` on Home and Menu.
- Home: one `main`, one `header`, one `nav`, one `footer`; no missing image `alt`, empty button names, duplicate IDs, or unlabeled form controls detected by the baseline heuristic.
- Menu: one `main` and one `header`; no missing image `alt`, empty button names, or duplicate IDs detected.
- Menu has one search input that depends on a visually-hidden label wrapper but was not recognized by the baseline label heuristic; this requires an explicit label/`aria-label` verification in UX-02.
- The menu renders the product name of every product as an `h2`, producing 142 second-level headings in the initial DOM.
- Reduced-motion CSS exists and globally reduces animation/transition duration.
- Automated axe Serious/Critical counts are **not established**. Local Chromium download timed out three times and PageSpeed Insights quota was unavailable. No PASS claim is made.

## Typography, tokens, and motion

### Reusable foundations

- `next/font` loads Manrope and Noto Sans Arabic with CSS variables and `display: swap`.
- Theme preference supports `dark`, `light`, and `system` with cookie/local-storage bootstrap that avoids theme flash.
- Existing primitives cover buttons, icon buttons, badges, surfaces, fields, alerts, skeletons, empty states, and scrollable table regions.
- Focus-visible styling, 44 px touch targets, reduced motion, logical properties, locale-specific display sizing, and RTL-aware directional icons already exist.
- Motion is implemented through Framer Motion and CSS.

### Consolidation gaps

- Semantic tokens, component CSS, page CSS, legacy aliases, and phase-specific styling are mixed in a 1,360-line `globals.css` plus two phase CSS files.
- Color and spacing magic values remain throughout JSX and CSS.
- Token names mix primitive (`gold`, `cream`), semantic (`brand`, `foreground`), and legacy (`premium-gold`) vocabularies without a documented contract.
- Motion currently uses durations beyond the requested three-tier contract and includes page-specific timing values.
- Breakpoints and z-index layers are not centrally documented.
- Customer and operator surfaces share colors but do not yet have an explicit density/personality token layer.

## Reuse map

Retain and evolve:

- Menu Authority, immutable revision/checksum, published-revision cache, and live media/status overlay.
- `next/image`, real SALORA product media, bilingual product fields, modifiers, and order contracts.
- Theme bootstrap, `ThemeControl`, icon registry, core primitives, focus treatment, logical properties, and reduced-motion support.
- Control Tower server auth/RBAC, permission-filtered section registry, command palette safety boundary, audit/domain APIs, and human approval gates.
- Loading/error surfaces for `/menu`.

Consolidate later:

- `PremiumHomeExperience` and `MenuExperience` client boundaries.
- Dashboard component family reused inside Control Tower.
- Product/media/publish surfaces currently nested in Catalog tabs.
- Control Tower registry labels/groups against the target Operator IA.

Retire later, not in UX-01:

- `/dashboard/*` after role/route parity is proven.
- P36 activation UI, 117/v2 assumptions, and related compatibility surfaces after v3-only rollback evidence exists.
- Legacy CSS aliases only after all consuming pages migrate to semantic Experience 3.0 tokens.

## Main UX bottlenecks

1. Menu discovery begins with the entire catalog rather than a moment/category choice.
2. Initial HTML, JavaScript, image requests, and heading density scale with catalog size.
3. Home and Menu are large page-level client islands.
4. There is no canonical product deep-link route behind quick view.
5. Visual categories and grounded pairing are not first-class discovery objects.
6. Control Tower route consolidation exists, but task hierarchy and legacy workspace composition remain mixed.
7. Tokens and primitives exist but are not yet a versioned, documented Design System contract.

## UX-01 implementation boundary

### In scope

- Central, versioned CSS tokens: primitives, semantic color, typography, spacing, radius, elevation, opacity, motion, z-index, containers, grid, focus, state, customer personality, and operator personality.
- A typed TypeScript token registry for non-CSS consumers and breakpoint documentation.
- Backward-compatible aliases so current Home/Menu/Control Tower behavior does not change in the foundation PR.
- Normalize the core primitive family to shared component classes and states.
- Document typography, RTL, motion, accessibility, and token usage rules.
- Add deterministic contract tests and run typecheck/lint/build/regression gates.

### Explicitly out of scope

- Menu category-first loading or API changes.
- Home/Menu/Control Tower page redesign.
- Database/schema/RLS/storage changes.
- Product, price, media, availability, revision, Harmony, or loyalty changes.
- AI search, pairing, taste profiles, Moments, Surprise Me, Insights, or publishing changes.
- Legacy deletion.
- Merge or Production deployment.

## UX-01 target

Create the smallest foundation PR that makes subsequent Menu 3.0 work faster and safer without changing current data authority, route behavior, or visual content. Generated concept studies are directional references only; generated product names, prices, metrics, dates, and copy are not production data and must never be implemented.
