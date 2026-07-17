-- Emergency rollback only: restore catalog rows reclassified by this migration.
update public.catalog_products as product
set brand_key = 'SALORA'
where product.brand_key = 'LEGACY'
  and not exists (
    select 1 from public.product_media_drafts as draft
    where draft.product_id = product.id and draft.source = 'seed_catalog'
  );

update public.product_categories
set brand_key = 'SALORA'
where brand_key = 'LEGACY';
