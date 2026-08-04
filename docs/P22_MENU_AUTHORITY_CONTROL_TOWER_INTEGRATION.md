# SALORA P22 — Menu Authority & Control Tower Integration

## Catalog authority

- Total products: **117**
- Unique product slugs: **117**
- ACTIVE-by-approved-price: **104**
- DRAFT-by-missing-approved-price: **13**
- Categories: **16**
- Duplicate products: **0**
- Duplicate categories: **0**

The thirteen drafts are intentionally retained and are never exposed through a
published revision until price and content approval is complete.

## Runtime authority

The canonical public contract is `MenuCollectionRevision` contract version 2.
It freezes collection metadata, ordered sections, membership overrides,
product identity, bilingual content, current catalog price inputs, variants,
add-ons, modifiers, availability, media and verified food-data profiles.

`SALORA_MENU_AUTHORITY_MODE` controls migration safety:

- `required`: a canonical published revision is mandatory;
- `compat`: prefer the canonical revision and use the live database catalog
  only while an environment is awaiting P21/P22 activation.

There is no static JSON or `@salora/data` public fallback.

## Channel synchronization

- Website `/menu`: consumes the authority snapshot.
- QR menu: resolves to the same `/menu` renderer.
- Mobile: consumes `/api/v1/menu-authority`, caches the last revision and
  reports offline mode explicitly.
- AI: receives only products from the same authority snapshot.
- Search: filters the revision products through the versioned API.
- Analytics: events must reference the current published revision ID.
- Control Tower: operates through the existing P21 domain service and RBAC.

## Safety

- No production migration is applied.
- No production data is modified.
- No parallel menu tables or engines are introduced.
- Existing `/api/products` remains backward compatible while exposing revision
  metadata.
- Compatibility mode is explicit and observable, never a hidden fallback.
