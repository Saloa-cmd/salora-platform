# SALORA P11 — Interface Clarity Foundation

## Outcome

P11 reduces decision overload in the public menu and Control Tower without changing the catalog, authentication, RBAC, content platform, or experience configuration contracts.

## Public menu

- A shorter, responsive hero brings discovery closer to the first viewport.
- One primary “Browse menu” action establishes the customer path.
- Pickup modes are grouped in one labelled choice surface.
- Search and categories remain visible while browsing.
- Category controls and product actions use dependable 44px touch targets.
- Product cards have calmer elevation, clearer price hierarchy, and one primary action.
- Mobile customers get a persistent order summary after adding an item.
- Arabic RTL and English LTR continue to use the same functional hierarchy.

## Control Tower

- The header is more compact and prioritizes daily commands.
- Customer-menu preview is promoted; secondary dashboard/security signals remain in their dedicated surfaces.
- Header controls meet the same touch-target contract as the customer menu.
- Sidebar retains the complete operating-system navigation and responsive drawer behavior.

## Accessibility contract

- All interactive controls expose a visible `:focus-visible` outline.
- Common buttons, tabs, inputs, and selects have a 44px minimum block size.
- Reduced-motion behavior remains supported.
- The existing skip link, semantic landmarks, dialog roles, tab states, and bilingual direction remain intact.

## Research basis

- Large café experiences prioritize menu discovery, categories, product details, customization, and repeatable ordering rather than a long marketing prelude.
- WCAG 2.2 target-size guidance requires at least 24×24 CSS pixels at Level AA; SALORA applies a stronger 44px interaction contract for primary controls.
- Keyboard focus is visually distinct and is not conveyed by color alone.

## Verification

- `pnpm --filter @salora/web typecheck`
- `pnpm --filter @salora/web lint`
- `pnpm --filter @salora/web build`
- `pnpm test`

