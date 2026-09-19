# UX-01 PR Contract — Design System 3.0 Foundation

## Objective

Establish one versioned design foundation for SALORA's customer and operator experiences while preserving current routes, authority, and rendering behavior.

## Scope

- Central Experience 3.0 token layer.
- Typed breakpoint/motion/z-index registry.
- Accessible shared primitive styles.
- Backward-compatible aliases for current production classes.
- Design System, Arabic/RTL, motion, accessibility, and performance documentation.
- Contract tests.

## Out of scope

- Page redesigns.
- Menu progressive loading.
- New routes or public API contracts.
- Database or publication changes.
- Dependency upgrades.
- PR #89 changes.
- Production deployment.

## Affected routes

All web routes inherit the token layer, but this PR intentionally preserves route markup and data flow. No route is added or removed.

## Affected data

None. The UI continues to consume Menu Authority v3 and current runtime configuration. No data is written.

## Design references

Two generated, non-production concept studies were reviewed for palette discipline, spacing rhythm, typography character, and the customer/operator personalities. They are deliberately excluded from the implementation diff: generated names, prices, metrics, claims, dates, images, and capabilities are not SALORA authority.

## Performance impact

Target: no meaningful HTML/JS regression. The token layer is static CSS; the typed registry must not be imported into client runtime unless needed. No new runtime dependency is permitted.

## Accessibility contract

- Focus visible in both themes and forced-colors mode.
- Minimum 44 px interactive targets.
- Reduced motion disables non-essential motion.
- Status is not conveyed by color alone in primitives.
- Arabic and English typography use semantic roles rather than page-specific sizes.

## Tests

- Token/primitive contract test.
- Existing typecheck, lint, regression tests, and build.
- Browser visual and keyboard verification when a browser runtime is available.
- Automated axe remains a release requirement for later route PRs; this foundation PR adds no route and does not claim an axe PASS without executable evidence.

## Rollback

Revert the UX-01 commit. Backward-compatible aliases make rollback independent of data, migrations, or publication state.
