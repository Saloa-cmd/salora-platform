# SALORA Menu Collections & Experience Program — P20 to P28

Prepared for the production SALORA platform after the P19 media-governance merge.

## 1. Non-negotiable architecture decision

SALORA keeps one authoritative product catalog. Products, prices, images, inventory, modifiers, availability, and order integrity remain stored once. Menu Collections are governed presentation experiences that reference catalog products; they never clone them.

The public experience will expose three top-level collections:

1. **SALORA Menu** — the full eligible catalog using the matte-black and warm-gold identity.
2. **قائمة الصحة / SALORA Wellness** — evidence-backed selections with restrained natural green accents.
3. **قائمة الأطفال / SALORA Kids** — parent-first, family-friendly presentation with disciplined warm accents.

A product can belong to zero, one, or several collections. Collection-specific title, description, crop, badge, and sort order may override presentation only. The authoritative product name, price, image record, availability, stock, and modifiers remain the source of truth.

## 2. Catalog-count truth

The current repository source and its contract test define **117 products across 16 categories**. The historical handoff value of 17 categories is not accepted as production truth until the read-only Supabase audit confirms whether production contains an extra SALORA category, an empty category, or a legacy record.

Collections are not catalog categories. SALORA Menu, SALORA Wellness, and SALORA Kids must not be counted as additional product categories.

Required truth gates:

- Source product count and unique slugs.
- Source category count and unique slugs.
- Production SALORA categories versus LEGACY categories.
- Product status totals.
- Empty categories.
- Category assignment drift.
- Public active-item total after availability rules.

No collection migration may start while source and production authority differ without an approved reconciliation plan.

## 3. Customer information architecture

### Level 1 — Menu experience

- All / SALORA Menu
- SALORA Wellness
- SALORA Kids

### Level 2 — Contextual sections

Sections are collection-specific and only appear when they contain publishable products. Examples:

**SALORA Wellness**

- Lighter selections
- No added sugar — only when evidence and applicable claim rules support it
- Plant-based choices
- Protein sources — only when evidence supports the claim
- Natural juices and blends
- Balanced-portion desserts
- Milk and sweetener customization

**SALORA Kids**

- Small caffeine-free drinks
- Juices and natural drinks
- Small bites
- Child portions
- Child and family bundles
- Seasonal selections

### Level 3 — Search and filters

- Allergens
- Caffeine
- Added sugar / sweetener data
- Plant-based suitability
- Price
- Availability

Filters remain hidden until the underlying data is complete enough to produce dependable results.

## 4. Unified visual system

All three collections use the same component architecture:

- Product image ratio: 4:5.
- Maximum two lines for product names.
- Maximum two lines for summaries.
- Stable price and availability positions.
- Maximum two card badges.
- Additional information inside the product detail sheet.
- Minimum practical touch target: 44 × 44 CSS pixels.
- Complete loading, missing-image, unavailable, empty, and failure states.
- Arabic and English semantic parity.
- Full RTL/LTR, keyboard, screen-reader, reduced-motion, and visible-focus support.
- WCAG 2.2 AA as the release target.

Collection identity changes only the supporting accent, editorial image treatment, and introductory content. It does not change interaction patterns or create three unrelated designs.

## 5. Food-information governance

SALORA Wellness is a merchandising collection, not a medical or therapeutic designation. Nutrition and health claims are blocked unless the data source, serving basis, reviewer, and evidence are recorded.

SALORA Kids is parent-first. It must expose serving size, caffeine presence, allergens, and customization warnings when verified. Ranking may prefer water, lower-sugar choices, appropriate portions, and caffeine-free products, but must not present medical advice.

Required governance states:

`DRAFT → CONTENT_REVIEW → FOOD_SAFETY_REVIEW → APPROVED → SCHEDULED/PUBLISHED`

Nutrition and allergen fields must carry provenance:

- source type;
- source document or recipe version;
- serving basis;
- reviewer;
- reviewed timestamp;
- validity/review date;
- confidence and verification state.

Precautionary allergen statements are never generated merely because an ingredient is absent. Cross-contact statements require an operational risk assessment and approved wording.

## 6. Proposed domain model

### MenuCollection

- id, brandKey, key, slug
- nameAr, nameEn, descriptionAr, descriptionEn
- kind: STANDARD | WELLNESS | KIDS | SEASONAL
- status: DRAFT | IN_REVIEW | APPROVED | SCHEDULED | PUBLISHED | PAUSED | ARCHIVED
- accent tokens, cover media, banner data
- channel flags: web, digital menu, mobile
- schedule and publication metadata
- archivedAt, createdAt, updatedAt

### MenuCollectionSection

- collectionId
- stable key
- bilingual names and descriptions
- sortOrder
- optional membership rule definition
- active state and archive metadata

### MenuCollectionProduct

- collectionId, sectionId, productId
- sortOrder
- presentation overrides only
- explicit membership source: MANUAL | RULE | AI_SUGGESTED
- reviewer and approval metadata
- unique collection/product/section constraints

### ProductNutritionProfile

- productId and serving basis
- calories, protein, carbohydrates, total sugar, added sugar, fat, saturated fat, sodium, caffeine
- units and nullable values
- source/provenance and verification status
- reviewer and review date

### ProductAllergenProfile

- productId
- contains allergens
- may-contain/cross-contact allergens
- ingredient version and operational source
- verification status, reviewer, review date

### MenuCollectionRevision

- immutable configuration snapshot
- actor, reason, previous/new values
- workflow status and approval references

### MenuPublication

- collection revision and channels
- scheduled/published timestamps
- deployment and smoke-test state
- rollback target

All entities use `brand_key = 'SALORA'`, RLS, safe archival instead of destructive deletion, permission-separated editing/review/publishing, and immutable audit events.

## 7. Control Tower redesign

Add **Menu Experience Management** as a first-class workspace with routes:

- `/control-tower/menu-experiences`
- `/control-tower/menu-experiences/[collectionId]`
- `/control-tower/menu-experiences/[collectionId]/sections`
- `/control-tower/menu-experiences/[collectionId]/products`
- `/control-tower/menu-experiences/[collectionId]/food-data`
- `/control-tower/menu-experiences/[collectionId]/preview`
- `/control-tower/menu-experiences/[collectionId]/publications`
- `/control-tower/menu-experiences/audit`

Operator capabilities:

- Create, edit, pause, archive, and restore collections.
- Drag-and-drop sections and products with keyboard alternatives.
- Assign one or many products.
- Run previewable membership rules.
- Apply collection-specific presentation overrides.
- Select media from the governed library and define responsive crops.
- Configure cover, accent, banner, and introductory content.
- Choose channels.
- Preview Arabic/English and mobile/tablet/desktop using the real menu renderer.
- Schedule, publish, pause, and roll back.
- Compare revisions.
- Show completeness blockers before approval or publication.

The existing long Content page must be split into task-focused routes. No control may look active unless it performs a real action; pending actions must be explicitly disabled and explained.

## 8. AI governance

AI may:

- suggest collection membership;
- flag missing nutrition/allergen fields;
- draft bilingual descriptions;
- review translation consistency;
- suggest ordering;
- recommend crop guidance;
- detect unsupported nutrition or health claims.

AI may not:

- verify nutrition values;
- infer allergen absence;
- approve a Wellness or Kids classification;
- publish a collection;
- overwrite authoritative price, stock, recipe, image, or availability data.

Every AI result is stored as a proposal with model/provider, prompt version, cost, timestamp, reviewer decision, and final disposition.

## 9. Integrated execution roadmap

Historical draft phase names are mapped forward to avoid colliding with the already merged P16–P19 repository history.

| New phase | Combined scope | Acceptance gate |
|---|---|---|
| **P20 — Authority & Toolchain Truth** | Permanent Node 22/pnpm enforcement, read-only production catalog audit, 16/17 reconciliation, master architecture | Clean toolchain; source/production report; no catalog mutation |
| **P21 — Collections Domain Foundation** | Prisma models, migration, RLS, repositories, permissions, immutable audit and rollback contracts | 117 products preserved; zero product duplication; migration tested on non-production |
| **P22 — Menu Experience Control Tower** | Collection CRUD, sections, membership, food-data workflow, completeness score, preview and approval UI | Every visible control works; RBAC and audit verified |
| **P23 — Customer Collections UX** | Three-level navigation, 4:5 cards, real Editorial mode, contextual filters, product sheets, checkout improvements | Arabic/English mobile-first visual QA; no misleading filter |
| **P24 — Control Tower Information Architecture** | Split Content workspace into task routes, operator dashboard, real health/notifications/user menu | One clear primary action per screen; no fake controls |
| **P25 — True No-Code Studio** | Block editor, governed media picker, real renderer preview, diff, approvals and rollback | Operator edits without JSON or code |
| **P26 — Food Safety, Accessibility & Performance** | Claim gates, allergen review, WCAG 2.2 AA, keyboard DnD alternative, Playwright, Lighthouse/Web Vitals | Safety review passed; accessibility blockers zero |
| **P27 — Staged Publication & Analytics** | Preview deployment, category batches, collection rollout, analytics, alerts, rollback drills | Reversible launch with post-deploy smoke tests |
| **P28 — Mobile/App Parity** | Expo collection consumption, deep links, cached configuration, consistent ordering and accessibility | Web and mobile use the same published collection contract |

## 10. Performance and quality gates

Field-performance targets at the 75th percentile for mobile and desktop:

- LCP ≤ 2.5 seconds.
- INP ≤ 200 milliseconds.
- CLS ≤ 0.1.

Additional gates:

- No unbounded 117-image eager loading.
- Responsive modern image formats and explicit dimensions.
- Stable skeleton geometry.
- Server-authoritative price and availability at checkout.
- No collection publication if required bilingual content, primary image, food-safety review, or approval is missing.
- Production smoke tests after every deployment.

## 11. Immediate next action

P20 runs first and remains non-destructive:

1. Enforce Node 22 and pinned pnpm before install, test, or build.
2. Run the source catalog audit.
3. Run the read-only Supabase comparison using encrypted environment variables.
4. Resolve the historical 17-category statement against the current 16-category source.
5. Approve the P21 migration design before applying any schema change.
