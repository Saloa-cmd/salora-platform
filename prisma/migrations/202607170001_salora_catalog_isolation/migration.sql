-- Preserve the pre-P3 catalog while exposing only the authoritative SALORA menu.
-- Seed-owned products are identified by their seed_catalog media draft.

update public.catalog_products as product
set brand_key = 'LEGACY'
where product.brand_key = 'SALORA'
  and not exists (
    select 1
    from public.product_media_drafts as draft
    where draft.product_id = product.id
      and draft.source = 'seed_catalog'
  );

update public.product_categories as category
set brand_key = 'LEGACY'
where category.brand_key = 'SALORA'
  and not exists (
    select 1
    from public.catalog_products as product
    join public.product_media_drafts as draft on draft.product_id = product.id
    where product.category_id = category.id
      and draft.source = 'seed_catalog'
  );
