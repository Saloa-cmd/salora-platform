-- Execute only after exporting the SALORA catalog and confirming no client depends on bilingual columns.
drop policy if exists "product_media_drafts_manager_write" on public.product_media_drafts;
drop policy if exists "product_modifiers_public_active_read" on public.product_modifiers;
drop policy if exists "product_addons_public_active_read" on public.product_addons;
drop policy if exists "product_variants_public_active_read" on public.product_variants;
drop policy if exists "product_images_public_active_read" on public.product_images;
drop policy if exists "product_images_manager_write" on public.product_images;
drop policy if exists "product_modifiers_manager_write" on public.product_modifiers;
drop policy if exists "product_addons_manager_write" on public.product_addons;
drop policy if exists "catalog_children_manager_write" on public.product_variants;
drop policy if exists "catalog_products_manager_write" on public.catalog_products;
drop policy if exists "product_categories_manager_write" on public.product_categories;
drop policy if exists "catalog_products_public_active_read" on public.catalog_products;
drop policy if exists "product_categories_public_read" on public.product_categories;

drop index if exists public.catalog_products_brand_key_status_idx;
alter table public.catalog_products drop column if exists description_en, drop column if exists description_ar, drop column if exists name_en, drop column if exists name_ar, drop column if exists brand_key;
alter table public.product_categories drop column if exists name_en, drop column if exists name_ar, drop column if exists brand_key;

-- Reapply the prior policies from 20260608_security_hardening before reopening traffic.
