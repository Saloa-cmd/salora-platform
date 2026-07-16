alter table public.product_categories
  add column if not exists brand_key varchar(40) not null default 'SALORA',
  add column if not exists name_ar varchar(120),
  add column if not exists name_en varchar(120);

alter table public.catalog_products
  add column if not exists brand_key varchar(40) not null default 'SALORA',
  add column if not exists name_ar varchar(160),
  add column if not exists name_en varchar(160),
  add column if not exists description_ar text,
  add column if not exists description_en text;

update public.product_categories
set name_en = coalesce(name_en, name)
where brand_key = 'SALORA';

update public.catalog_products
set name_en = coalesce(name_en, name),
    description_en = coalesce(description_en, description)
where brand_key = 'SALORA';

create index if not exists catalog_products_brand_key_status_idx
  on public.catalog_products (brand_key, status);

drop policy if exists "product_categories_public_read" on public.product_categories;
create policy "product_categories_public_read"
  on public.product_categories for select to anon, authenticated
  using (brand_key = 'SALORA');

drop policy if exists "catalog_products_public_active_read" on public.catalog_products;
create policy "catalog_products_public_active_read"
  on public.catalog_products for select to anon, authenticated
  using (brand_key = 'SALORA' and status = 'ACTIVE');

drop policy if exists "product_categories_manager_write" on public.product_categories;
create policy "product_categories_manager_write"
  on public.product_categories for all to authenticated
  using (public.salora_is_manager() and brand_key = 'SALORA')
  with check (public.salora_is_manager() and brand_key = 'SALORA');

drop policy if exists "catalog_products_manager_write" on public.catalog_products;
create policy "catalog_products_manager_write"
  on public.catalog_products for all to authenticated
  using (public.salora_is_manager() and brand_key = 'SALORA')
  with check (public.salora_is_manager() and brand_key = 'SALORA');

drop policy if exists "product_images_public_active_read" on public.product_images;
create policy "product_images_public_active_read"
  on public.product_images for select to anon, authenticated
  using (deleted_at is null and archived_at is null and exists (
    select 1 from public.catalog_products p
    where p.id = product_id and p.brand_key = 'SALORA' and p.status = 'ACTIVE'
  ));

drop policy if exists "product_variants_public_active_read" on public.product_variants;
create policy "product_variants_public_active_read"
  on public.product_variants for select to anon, authenticated
  using (exists (select 1 from public.catalog_products p where p.id = product_id and p.brand_key = 'SALORA' and p.status = 'ACTIVE'));

drop policy if exists "catalog_children_manager_write" on public.product_variants;
create policy "catalog_children_manager_write"
  on public.product_variants for all to authenticated
  using (public.salora_is_manager() and exists (select 1 from public.catalog_products p where p.id = product_id and p.brand_key = 'SALORA'))
  with check (public.salora_is_manager() and exists (select 1 from public.catalog_products p where p.id = product_id and p.brand_key = 'SALORA'));

drop policy if exists "product_addons_public_active_read" on public.product_addons;
create policy "product_addons_public_active_read"
  on public.product_addons for select to anon, authenticated
  using (exists (select 1 from public.catalog_products p where p.id = product_id and p.brand_key = 'SALORA' and p.status = 'ACTIVE'));

drop policy if exists "product_addons_manager_write" on public.product_addons;
create policy "product_addons_manager_write"
  on public.product_addons for all to authenticated
  using (public.salora_is_manager() and exists (select 1 from public.catalog_products p where p.id = product_id and p.brand_key = 'SALORA'))
  with check (public.salora_is_manager() and exists (select 1 from public.catalog_products p where p.id = product_id and p.brand_key = 'SALORA'));

drop policy if exists "product_modifiers_public_active_read" on public.product_modifiers;
create policy "product_modifiers_public_active_read"
  on public.product_modifiers for select to anon, authenticated
  using (exists (select 1 from public.catalog_products p where p.id = product_id and p.brand_key = 'SALORA' and p.status = 'ACTIVE'));

drop policy if exists "product_modifiers_manager_write" on public.product_modifiers;
create policy "product_modifiers_manager_write"
  on public.product_modifiers for all to authenticated
  using (public.salora_is_manager() and exists (select 1 from public.catalog_products p where p.id = product_id and p.brand_key = 'SALORA'))
  with check (public.salora_is_manager() and exists (select 1 from public.catalog_products p where p.id = product_id and p.brand_key = 'SALORA'));

drop policy if exists "product_images_manager_write" on public.product_images;
create policy "product_images_manager_write"
  on public.product_images for all to authenticated
  using (public.salora_is_manager() and exists (select 1 from public.catalog_products p where p.id = product_id and p.brand_key = 'SALORA'))
  with check (public.salora_is_manager() and exists (select 1 from public.catalog_products p where p.id = product_id and p.brand_key = 'SALORA'));

drop policy if exists "product_media_drafts_manager_write" on public.product_media_drafts;
create policy "product_media_drafts_manager_write"
  on public.product_media_drafts for all to authenticated
  using (public.salora_is_manager() and exists (select 1 from public.catalog_products p where p.id = product_id and p.brand_key = 'SALORA'))
  with check (public.salora_is_manager() and exists (select 1 from public.catalog_products p where p.id = product_id and p.brand_key = 'SALORA'));

comment on column public.catalog_products.brand_key is
  'Defense-in-depth catalog isolation key. Public SALORA clients may only read SALORA rows.';
