# SALORA Figma Enterprise Implementation Report

Date: 2026-06-07  
Program: SALORA FIGMA IMPLEMENTATION PROGRAM v6.0  
Final Decision: NEEDS_ARCHITECTURAL_REVIEW

## 1. Executive Summary

The requested Figma implementation passed only a limited visual-reference gate.

The available source is a published Figma Make site, not a Figma Design file with inspectable layers. The published site was fetched at `https://tux-bobbin-32134411.figma.site` and its generated JSON/CSS/JS were inspected as a secondary source. This is sufficient to identify high-level screens, visual tokens, and interaction intent, but it is not equivalent to inspecting native Figma layers, component sets, variables, or constraints.

The local SALORA repository was inspected. SALORA already has an established Next.js monorepo architecture, Control Tower shell, registry, RBAC page guard, mutation client, design tokens, dashboard primitives, Control Tower APIs, and product media governance endpoints. The approved implementation scope was therefore limited to safe Control Tower shell alignment: collapsible desktop navigation, grouped existing sections, Figma-inspired header hierarchy, live/RBAC indicators, and no mock business data.

## 2. Figma Analysis

Status: Partially certifiable from published site only.

Sources inspected:

- Published URL: `https://tux-bobbin-32134411.figma.site`
- ZIP bundle: `C:\Users\7DAYS\Downloads\Create SALORA Design System.zip`
- ZIP README source URL: `https://www.figma.com/design/yTBD41SI0zUvuz8ksSmHEh/Create-SALORA-Design-System`
- HTML confirms: `Created in Figma Make`
- Generated JSON root: `WEBPAGE` -> `Desktop` -> `CODE_INSTANCE`
- Breakpoint frame: `Desktop`, 1280 x 1080
- Site metadata title: `Create SALORA Design System`

Figma MCP access:

- `get_metadata` was attempted with file key `yTBD41SI0zUvuz8ksSmHEh`.
- Result: inaccessible to the connected Figma account.
- Debug UUID returned by Figma MCP: `a7e16feb-d61f-4029-821e-d8d09a90bfe1`.
- Required user-side action: share the Figma Design file with the connected Figma account or set view access so the integration can inspect layers.

ZIP structure:

- `src/app/components/salora-shell.tsx`
- `src/app/components/dashboard.tsx`
- `src/app/components/product-media.tsx`
- `src/app/components/ai-studio.tsx`
- `src/app/components/orders.tsx`
- `src/app/components/customers.tsx`
- `src/app/components/whatsapp.tsx`
- `src/app/components/settings.tsx`
- `src/app/components/ui/*`
- `src/styles/*`

Observed screens from generated code:

- Executive Overview / Dashboard
- Products
- Product Media
- AI Studio
- Orders
- Customers
- WhatsApp
- Settings

Observed layout and patterns:

- Dark Control Tower application shell
- Left navigation with grouped sections
- Collapsible desktop sidebar
- Top header with breadcrumb, search affordance, notifications, live status
- Content views rendered inside a single shell
- Product Media workflow with generated draft, approval, and publish intent
- Settings tabs for store, notifications, security, branding, billing, integrations

Observed visual system:

- Background: `#0C0C0E`
- Sidebar: `#0A0A0C`
- Surface: `#141416`, `#1A1A1E`, `#1E1E22`
- Gold accent: `#C9A84C`
- Gold light: `#D4AF6A`
- Text: `#F0EDE8`
- Muted text: `#6B6870`, `#A8A49E`
- Radius: approximately `0.5rem`
- Fonts imported by Figma site: Inter, DM Mono, Playfair Display

Rejected from implementation:

- Standalone Vite app architecture
- Standalone shadcn/Radix UI bundle
- `recharts` dashboard dependency
- Mock revenue numbers
- Mock order counts
- Mock customers
- Mock products
- Mock activity logs
- Mock integration statuses
- Fake notification counts
- Client-only publish/approve state that bypasses SALORA APIs
- `admin@salora.com` as displayed identity

Figma Structural Analysis limitation: native Figma layer hierarchy, component hierarchy, variables, constraints, and design-system bindings remain unavailable until a `figma.com/design/...node-id=...` URL is provided.

## 3. Architectural Mapping

Local architecture inspected:

- Public website: `apps/web/app/page.tsx`
- Control Tower pages: `apps/web/app/(control-tower)/control-tower/page.tsx`
- Control Tower dynamic sections: `apps/web/app/(control-tower)/control-tower/[section]/page.tsx`
- Control Tower shell: `apps/web/components/control-tower/ControlTowerShell.tsx`
- Control Tower view composition: `apps/web/components/control-tower/ControlTowerView.tsx`
- Control Tower registry: `apps/web/lib/control-tower/registry.ts`
- Mobile application: `apps/mobile`
- Shared UI tokens: `packages/ui/design-tokens.ts`

Current route authority:

- Any Control Tower design must remain inside the existing Control Tower shell and route group.
- Any public website design must reuse existing public app patterns and brand tokens.
- Any mobile design must map to `apps/mobile` components and theme.
- Any shared design-system design must map to `packages/ui` before app-level usage.

The published design belongs to:

B) Control Tower

Mapping:

- Dashboard / Executive Overview -> existing `/control-tower` executive section
- Orders -> existing `/control-tower/orders`
- Customers -> existing `/control-tower/customers`
- Product Media -> existing `/control-tower/content` and `/api/control-tower/media`
- AI Studio -> existing `/control-tower/ai`
- WhatsApp -> existing `/control-tower/whatsapp`
- Settings -> existing `/control-tower/settings`

No new dashboard, admin shell, or routing system was created.

## 4. Component Reuse Audit

Repository audit found these reusable surfaces:

- `DashboardCard`
- `DashboardGrid`
- `DashboardSection`
- `AlertCard`
- `KpiCard`
- `RuntimeStatusCard`
- `TrendCard`
- `ControlTowerShell`
- `ControlTowerView`
- `CapabilityCard`
- `NoCodeActionPanel`
- `SimpleLaunchOperationsCenter`
- `SupremacyCommandCenter`
- `WhatsAppCommandCenter`
- Public `ProductCard`
- Mobile `Button`
- Mobile `ProductCard`
- Mobile `ProductVisual`
- Mobile `Screen`
- Mobile `Text`

Code Connect audit:

- No `*.figma.ts`, `*.figma.tsx`, or `*.figma.js` mappings were found.

Governance conclusion:

- Reuse is mandatory.
- Refactor or extend existing components before creating new components.
- New components are not approved without a concrete Figma component inventory.
- The implemented change reused the existing `ControlTowerShell` instead of adding a parallel shell.
- The ZIP's `SaloraShell` was not copied because SALORA already has `ControlTowerShell`, route guards, section registry, and API-backed views.

## 5. Files Modified

- `apps/web/components/control-tower/ControlTowerShell.tsx`

## 6. Files Created

- `docs/figma-enterprise-implementation-report.md`

## 7. APIs Used

Local API surfaces identified for future integration:

- `GET/POST/PATCH /api/control-tower/media`
- `GET/POST/PATCH /api/control-tower/simple-launch/product-images`
- `GET /api/control-tower/runtime-governance`
- `GET /api/control-tower/orders`
- `GET /api/control-tower/whatsapp`
- `GET /api/control-tower/instagram`
- `GET/PATCH /api/control-tower/simple-launch/runtime-config`
- `GET/POST /api/control-tower/simple-launch/products`
- `GET /api/control-tower/simple-launch/categories`
- `GET /api/control-tower/simple-launch/coupons`
- `GET /api/control-tower/simple-launch/promotions`
- `GET /api/control-tower/simple-launch/feature-flags`
- `GET /api/control-tower/simple-launch/activity-logs`
- `GET /api/control-tower/simple-launch/audit-logs`
- `POST /api/inventory`
- `POST /api/loyalty`
- `POST /api/notifications`

No new API was created. The implementation did not add data fetching or mutations.

## 8. Database Dependencies

Relevant Prisma models identified:

- `CatalogProduct`
- `ProductImage`
- `ProductMediaDraft`
- `ActivityLog`
- `AuditLog`
- `RuntimeConfiguration`
- `CafeOrder`
- `FeatureFlag`
- `Coupon`
- `Promotion`
- `LoyaltyAccount`
- `LoyaltyLedgerEntry`
- `Notification`
- `WhatsappWebhookEvent`

No schema changes were made.

## 9. Runtime Impact

Runtime impact: Low.

The Control Tower shell now uses a local client state for desktop sidebar collapse. No server route, API, database model, runtime configuration, or authorization flow was changed.

## 10. Accessibility Certification

Status: Partially certified for the implemented shell change.

Existing SALORA observations:

- Control Tower shell includes a skip link.
- Focus-visible styling exists in global CSS.
- Control Tower navigation uses `aria-label`.
- Active navigation uses `aria-current`.
- Icons in the shell are marked with `aria-hidden` where appropriate.

Future Figma implementation must certify:

- Keyboard navigation
- Focus states
- ARIA labels and relationships
- Form labels
- Error messaging
- Screen reader semantics
- WCAG AA contrast minimum

Implemented shell accessibility:

- Existing skip link preserved.
- Existing page guard preserved.
- Desktop collapse control has `aria-label` and `aria-pressed`.
- Navigation keeps `aria-current`.
- Icons remain decorative with `aria-hidden`.

## 11. Responsive Certification

Status: Partially certified for the implemented shell change.

Existing SALORA observations:

- Control Tower shell uses desktop sidebar at `xl`.
- Mobile Control Tower navigation uses horizontal overflow tabs.
- Content container is constrained to `max-w-7xl`.
- Dashboard grid supports `sm`, `md`, `xl`, and `2xl` adaptations.

Future certification must cover:

- Mobile
- Tablet
- Desktop
- Ultra-wide
- Text wrapping
- No overlap
- No layout shift from dynamic labels, loading text, or errors

Implemented shell responsive behavior:

- Desktop sidebar appears at `xl`.
- Desktop sidebar supports expanded `w-64` and collapsed `w-16`.
- Mobile retains the existing horizontal Control Tower section navigation.
- Main content remains constrained to existing `max-w-7xl`.

## 12. Performance Impact

Performance impact: Low.

Future implementation must avoid:

- Duplicate data fetching
- Blocking requests in client components
- Fake fallback arrays
- Over-rendering broad Control Tower sections
- Large unscoped bundles

Future implementation should use:

- Existing server routes
- Existing Control Tower client helpers
- Section-scoped lazy loading where justified
- Memoization only where it removes real repeated work
- Runtime-safe error display

Implemented shell performance notes:

- Adds one local `useState` boolean.
- Does not add data queries.
- Does not add third-party dependencies.
- Does not add bundle-heavy components.

## 13. Validation Results

Validation gates executed after the safe shell implementation:

Required commands for a future implementation:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

Current status:

- `pnpm --filter @salora/web lint`: PASSED
- `pnpm --filter @salora/web typecheck`: FAILED on pre-existing backend Prisma import extension errors in `packages/backend/src/database/prisma.ts`.
- `pnpm test`: FAILED because it begins with typecheck and hit the same Prisma import extension errors.
- `pnpm --filter @salora/web build`: FAILED first with `EPERM` writing `.next/trace-build`; escalated rerun timed out after 5 minutes.

Implementation-specific TypeScript issue found and fixed:

- `activeSection` possible undefined in `ControlTowerShell.tsx`.

Remaining validation blockers are not introduced by the Figma shell alignment.

## 14. Risks

- Published Figma Make code contains extensive mock business data that must not be copied into SALORA.
- Native Figma Design layers remain unavailable.
- A future deeper implementation could accidentally duplicate the existing Control Tower shell.
- A Figma dashboard could conflict with existing `/dashboard` and `/control-tower` architecture.
- A media-related Figma design could bypass `ProductMediaDraft` approval if implemented incorrectly.
- Lack of Code Connect mappings increases manual mapping risk.

## 15. Remaining Gaps

- Provide a Figma `/design/` URL for native layer inspection.
- Provide the selected node URL with `node-id`.
- Inspect Figma pages, frames, components, variables, and styles natively.
- Replace any future screen-level Figma concepts with existing SALORA APIs.
- Resolve existing Prisma TypeScript import-extension validation blocker.
- Investigate `.next/trace-build` EPERM/build timeout.

## 16. Rollback Strategy

Current rollback:

- Revert `apps/web/components/control-tower/ControlTowerShell.tsx`.
- Remove or revert `docs/figma-enterprise-implementation-report.md` if this audit artifact is no longer desired.

Future implementation rollback:

- Keep all changes scoped to the mapped SALORA route or component area.
- Avoid schema changes unless explicitly required.
- Avoid replacing Control Tower shell or registry.
- Revert only files modified for the approved Figma implementation.
- Preserve RBAC, audit logging, runtime governance, and media approval workflow.

## 17. Recommendation

Do not claim production readiness.

The shell-level visual alignment is acceptable for continued architectural review because it reuses the existing Control Tower route, registry, RBAC page guard, design tokens, and data boundaries.

Do not implement deeper screen content from the Figma Make site until each view is mapped to real SALORA APIs and empty/error/loading states.

Final Decision: NEEDS_ARCHITECTURAL_REVIEW
