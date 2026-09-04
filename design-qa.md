# SALORA Control Tower — Design QA

## Result

BLOCKED — authenticated visual review required

## Review target

- Pull request: #68
- Preview: https://salora-platform-git-agent-control-to-df1f12-saloa-cmds-projects.vercel.app
- Source evidence: the supplied iPhone screenshots of the current Production Control Tower
- Intended outcome: an operator-first, low-noise, bilingual Control Tower that progressively reveals advanced tools

## Verified

- The public Preview is deployed and reachable through Vercel.
- Unauthenticated Control Tower access redirects to the secure login route.
- The login screen renders meaningful Arabic content without a framework error overlay.
- Navigation is reduced to four clear groups and a four-item mobile bottom navigation.
- Primary routes keep permission filtering and authenticated server/API boundaries.
- The overview uses the live data-pulse endpoint rather than placeholder metrics.
- Product, media, review/publish, and product-settings tools are grouped behind progressive-disclosure tabs.
- Orders, customers, AI, operations, and settings now use the same progressive-disclosure pattern instead of stacking long workspaces.
- All workspace tabs expose tab/tabpanel relationships, roving focus, and Arrow/Home/End keyboard navigation.
- Technical PostgreSQL/RLS language, capability-card noise, the non-functional notification control, and the global copilot are removed from the primary workflow.
- RTL metric direction is explicitly stabilized.
- TypeScript, lint, production build, accessibility contracts, responsive contracts, security contracts, and the full repository test sequence pass.

## Remaining authenticated checks

- Capture and compare Overview at 390×844 and 1440×900.
- Confirm there is no horizontal overflow in Arabic and English.
- Exercise the mobile bottom navigation and sidebar.
- Exercise the Products progressive-disclosure tabs.
- Confirm focus order, visible focus, 44px touch targets, reduced motion, dark/light/system themes, and scroll-position behavior.
- Check browser console and API responses while authenticated.

## Blocker

The Preview correctly requires an Admin session. No password was requested, read, stored, or bypassed. The owner must complete login in the handed-off browser session before the authenticated screenshots and interaction checks can be completed.
