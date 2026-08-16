# SALORA P25 — Experience Control Plane Foundation

Baseline: `71676f057b7c18451cc1ab0abd5cd5d7e088b23d`  
Scope: PR1 architecture foundation only. No production persistence activation.

## Decision

SALORA will extend its existing experience, CMS, Control Tower, design-token, audit, and authorization foundations. It will not create a second dashboard, a second revision system, or an arbitrary page builder.

```text
P23 Design Tokens
  -> SALORA Icon Registry
  -> Component Registry
  -> Experience Schema v2
  -> Governed Renderer
  -> Web / Mobile / Digital Menu adapters
  -> Existing CMS revision + approval layer
  -> Existing Control Tower
  -> Human-reviewed AI proposals
```

Menu data remains an independent authority and enters the renderer only through `menu-authority-adapter`. Presentation configuration cannot expose a product rejected by the active data contract.

## Reuse map

| Existing capability | Decision | P25 use |
|---|---|---|
| P23 semantic tokens and primitives | KEEP + EXTEND | All generated surfaces and Studio chrome |
| `ExperienceConfiguration` v1 | KEEP + ADAPT | Production-compatible bridge during rollout |
| `RuntimeConfiguration` draft/published keys | KEEP TEMPORARILY | No PR1 persistence change |
| `CmsDocument/CmsRevision/CmsApproval` | EXTEND IN PR4 | Canonical governed experience revisions after staging proof |
| Control Tower page/auth/audit | HARDEN | Single control plane; server-enforced permissions |
| `SaloraIcon` + Lucide | EXTEND | One semantic icon registry |
| Public menu snapshot | KEEP | Legacy and future revision sources behind one adapter |
| Existing direct publish action | REFACTOR IN PR4 | Replace with draft → review → approval → publish workflow |

## Foundation contracts

- `ExperiencePageV2` is typed, versioned, bilingual and platform-aware.
- Sections are a closed discriminated union. Unsupported component identifiers fail validation.
- Layout uses approved width, spacing, alignment and surface presets.
- Actions accept internal paths or HTTPS destinations only.
- Assets are referenced by governed IDs, not arbitrary executable content.
- Platform overrides are sparse (`shared content + overrides`) and must reference real section IDs.
- Renderer never executes HTML, CSS, JavaScript or user code.
- The compatibility adapter produces a DRAFT only and cannot publish or mutate Menu Authority.

## Component Registry v1

| Component | Platforms | Purpose |
|---|---|---|
| `hero.luxury.v1` | Web, Mobile, Digital Menu | Premium bilingual hero |
| `menu.product-grid.premium.v1` | Web, Mobile, Digital Menu | Authority-backed product presentation |
| `story.editorial.v1` | Web, Mobile | Brand story |
| `location.map-card.v1` | Web, Mobile, Digital Menu | Accessible location and directions |
| `cta.gold.v1` | Web, Mobile, Digital Menu | Governed primary action |

Each registry entry declares variants, platforms, allowed properties, required data, theme support and accessibility rules.

## Security boundaries

- No raw HTML, JavaScript, CSS, SQL, secrets or server routes in experience data.
- URL schemes are allowlisted; external actions require HTTPS and an explicit external flag.
- Schema objects are strict to reject configuration poisoning through unknown fields.
- Drafts must not be public or guessable. Preview authorization design belongs to PR3 and must use server-side authorization/cookies, not query-string secrets.
- AI may create structured proposals only. It cannot approve, publish, rollback or access private customer/payment data.
- Publish, rollback, navigation replacement and global theme changes require server permission checks, confirmation, impact summary and audit records.

## Persistence decision

No migration is justified in PR1. Existing CMS models already provide documents, immutable payload revisions and approvals. PR4 should prove that they can represent Experience v2 in isolated staging, add only missing constraints/indexes/RLS if evidence requires them, and request separate production approval before any activation.

## Delivery sequence

1. PR1 — schema, registries, renderer contract, compatibility, tests and this ADR.
2. PR2 — semantic dark/light/system themes, hydration-safe preference and web/mobile icon parity.
3. PR3 — premium three-panel Studio, page tree, inspector and authorized responsive preview.
4. PR4 — CMS-backed draft/review/approval/publish/diff/history/rollback; retire direct publish.
5. PR5 — governed asset and brand studio.
6. PR6 — navigation and menu presentation adapters.
7. PR7 — structured AI proposals with human approval.
8. PR8 — WCAG, visual, performance, security and production-equivalent certification.

## Production gates

PR1 contains no migration, DDL, DML, database write, environment mutation, secret change, Menu Authority activation, manual deployment or merge. Any later production schema or publishing activation needs a new explicit production approval.
