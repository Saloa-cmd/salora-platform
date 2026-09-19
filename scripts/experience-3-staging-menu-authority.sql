-- SALORA Experience 3.0 — isolated Staging Menu Authority bootstrap.
-- DML only. It never updates catalog products, prices, images, RLS, Auth, or Production.
-- The project-data guard intentionally binds this operation to salora-staging.

begin;

-- Match the application domain service's recursive, key-sorted JSON checksum.
-- This function lives only in the database session's temporary schema.
create or replace function pg_temp.salora_stable_json(value jsonb)
returns text
language sql
immutable
as $stable_json$
  select case jsonb_typeof(value)
    when 'array' then '[' || coalesce((
      select string_agg(pg_temp.salora_stable_json(element), ',' order by ordinality)
      from jsonb_array_elements(value) with ordinality as items(element, ordinality)
    ), '') || ']'
    when 'object' then '{' || coalesce((
      select string_agg(to_jsonb(key)::text || ':' || pg_temp.salora_stable_json(item), ',' order by key)
      from jsonb_each(value) as properties(key, item)
    ), '') || '}'
    else value::text
  end
$stable_json$;

do $bootstrap$
declare
  v_actor_id uuid := '00000000-0000-0000-0000-000000000022';
  v_collection_id uuid;
  v_revision_id uuid := gen_random_uuid();
  v_publication_id uuid := gen_random_uuid();
  v_snapshot jsonb;
  v_checksum text;
  v_now timestamptz := clock_timestamp();
  v_catalog_count integer;
  v_active_count integer;
  v_invalid_price_count integer;
  v_primary_image_count integer;
  v_staging_image_count integer;
  v_production_image_count integer;
  v_existing_revision_id uuid;
  v_existing_contract_version integer;
  v_existing_revision_products integer;
begin
  select
    count(*) filter (where p.brand_key = 'SALORA'),
    count(*) filter (where p.brand_key = 'SALORA' and p.status = 'ACTIVE'),
    count(*) filter (where p.brand_key = 'SALORA' and p.base_price <= 0)
  into v_catalog_count, v_active_count, v_invalid_price_count
  from public.catalog_products p;

  select
    count(distinct i.product_id) filter (
      where p.brand_key = 'SALORA'
        and i.is_primary = true
        and i.public_url is not null
        and i.archived_at is null
        and i.deleted_at is null
    ),
    count(*) filter (
      where p.brand_key = 'SALORA'
        and i.is_primary = true
        and i.public_url like '%grcycqdtjjfklibutfos.supabase.co%'
        and i.archived_at is null
        and i.deleted_at is null
    ),
    count(*) filter (
      where p.brand_key = 'SALORA'
        and i.is_primary = true
        and i.public_url like '%xikqnzvfnquiqyybkyvw.supabase.co%'
        and i.archived_at is null
        and i.deleted_at is null
    )
  into v_primary_image_count, v_staging_image_count, v_production_image_count
  from public.product_images i
  join public.catalog_products p on p.id = i.product_id;

  if v_catalog_count <> 139
    or v_active_count <> 139
    or v_invalid_price_count <> 0
    or v_primary_image_count <> 139
    or v_staging_image_count <> 117
    or v_production_image_count <> 0 then
    raise exception 'Staging Menu Authority precondition failed: catalog %, active %, invalid %, primary %, staging-host %, production-host %',
      v_catalog_count, v_active_count, v_invalid_price_count, v_primary_image_count,
      v_staging_image_count, v_production_image_count;
  end if;

  select
    c.id,
    c.active_revision_id,
    nullif(r.snapshot ->> 'contractVersion', '')::integer,
    coalesce(jsonb_array_length(r.snapshot -> 'products'), 0)
  into v_collection_id, v_existing_revision_id, v_existing_contract_version, v_existing_revision_products
  from public.menu_collections c
  left join public.menu_collection_revisions r on r.id = c.active_revision_id
  where c.brand_key = 'SALORA'
    and c.key = 'salora-menu'
    and c.archived_at is null
  limit 1;

  if v_collection_id is not null then
    if v_existing_revision_id is not null
      and v_existing_contract_version = 2
      and v_existing_revision_products = 139 then
      return;
    end if;
    raise exception 'A non-certifiable salora-menu collection already exists on Staging.';
  end if;

  v_collection_id := gen_random_uuid();

  insert into public.menu_collections (
    id, brand_key, key, slug, kind, status, name_ar, name_en,
    description_ar, description_en, accent_tokens, channels,
    completeness_score, published_at, created_by, updated_by, created_at, updated_at
  ) values (
    v_collection_id, 'SALORA', 'salora-menu', 'salora-menu',
    'STANDARD'::public."MenuCollectionKind", 'PUBLISHED'::public."MenuCollectionStatus",
    'منيو سالورا', 'SALORA Menu',
    'المصدر الموثوق والمعزول لمنيو سالورا في بيئة المعاينة.',
    'The isolated authoritative SALORA menu for Preview certification.',
    '{}'::jsonb, array['WEB', 'DIGITAL_MENU', 'MOBILE']::text[],
    100, v_now, v_actor_id, v_actor_id, v_now, v_now
  );

  insert into public.menu_collection_sections (
    id, collection_id, key, name_ar, name_en, sort_order,
    is_active, created_by, updated_by, created_at, updated_at
  )
  select
    gen_random_uuid(), v_collection_id, c.slug,
    coalesce(c.name_ar, c.name), coalesce(c.name_en, c.name), c.sort_order,
    true, v_actor_id, v_actor_id, v_now, v_now
  from public.product_categories c
  where c.brand_key = 'SALORA'
    and exists (
      select 1 from public.catalog_products p
      where p.category_id = c.id and p.brand_key = 'SALORA' and p.status = 'ACTIVE'
    )
  order by c.sort_order, c.slug;

  insert into public.menu_collection_products (
    id, collection_id, section_id, product_id, sort_order,
    badges, membership_source, source_reason, is_featured,
    created_by, updated_by, created_at, updated_at
  )
  select
    gen_random_uuid(), v_collection_id, s.id, p.id,
    row_number() over (partition by p.category_id order by p.name, p.slug)::integer * 10,
    array[]::text[], 'MANUAL'::public."MenuMembershipSource",
    'Experience 3.0 isolated Staging authority bootstrap from the existing governed catalog.',
    ('signature' = any(p.tags)), v_actor_id, v_actor_id, v_now, v_now
  from public.catalog_products p
  join public.product_categories c on c.id = p.category_id
  join public.menu_collection_sections s
    on s.collection_id = v_collection_id and s.key = c.slug
  where p.brand_key = 'SALORA' and p.status = 'ACTIVE'
  order by c.sort_order, p.name, p.slug;

  select jsonb_build_object(
    'contractVersion', 2,
    'generatedAt', to_char(v_now at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'collection', jsonb_build_object(
      'id', c.id,
      'brandKey', c.brand_key,
      'key', c.key,
      'slug', c.slug,
      'kind', c.kind::text,
      'status', c.status::text,
      'nameAr', c.name_ar,
      'nameEn', c.name_en,
      'descriptionAr', c.description_ar,
      'descriptionEn', c.description_en,
      'accentTokens', c.accent_tokens,
      'coverMedia', c.cover_media,
      'banner', c.banner,
      'channels', to_jsonb(c.channels),
      'completenessScore', c.completeness_score
    ),
    'sections', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', s.id,
        'key', s.key,
        'nameAr', s.name_ar,
        'nameEn', s.name_en,
        'descriptionAr', s.description_ar,
        'descriptionEn', s.description_en,
        'sortOrder', s.sort_order,
        'membershipRule', s.membership_rule,
        'isActive', s.is_active
      ) order by s.sort_order, s.key), '[]'::jsonb)
      from public.menu_collection_sections s
      where s.collection_id = c.id and s.archived_at is null
    ),
    'products', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'membership', jsonb_build_object(
          'id', m.id,
          'sectionId', m.section_id,
          'sortOrder', m.sort_order,
          'titleArOverride', m.title_ar_override,
          'titleEnOverride', m.title_en_override,
          'descriptionArOverride', m.description_ar_override,
          'descriptionEnOverride', m.description_en_override,
          'presentationImage', m.presentation_image,
          'badges', to_jsonb(m.badges),
          'membershipSource', m.membership_source::text,
          'membershipRuleKey', m.membership_rule_key,
          'sourceReason', m.source_reason,
          'isFeatured', m.is_featured
        ),
        'product', jsonb_build_object(
          'id', p.id,
          'slug', p.slug,
          'name', p.name,
          'nameAr', p.name_ar,
          'nameEn', p.name_en,
          'description', p.description,
          'descriptionAr', p.description_ar,
          'descriptionEn', p.description_en,
          'status', p.status::text,
          'basePrice', p.base_price::text,
          'tags', to_jsonb(p.tags),
          'pairingHint', p.pairing_hint,
          'aiDescriptor', p.ai_descriptor,
          'category', jsonb_build_object(
            'id', pc.id,
            'slug', pc.slug,
            'name', pc.name,
            'nameAr', pc.name_ar,
            'nameEn', pc.name_en,
            'sortOrder', pc.sort_order
          ),
          'images', (
            select coalesce(jsonb_agg(jsonb_build_object(
              'id', i.id,
              'productId', i.product_id,
              'storageBucket', i.storage_bucket,
              'storagePath', i.storage_path,
              'publicUrl', i.public_url,
              'altText', i.alt_text,
              'sortOrder', i.sort_order,
              'isPrimary', i.is_primary,
              'metadata', i.metadata
            ) order by i.is_primary desc, i.sort_order, i.created_at), '[]'::jsonb)
            from public.product_images i
            where i.product_id = p.id and i.deleted_at is null and i.archived_at is null
          ),
          'variants', (
            select coalesce(jsonb_agg(jsonb_build_object(
              'id', v.id, 'productId', v.product_id, 'name', v.name,
              'priceDelta', v.price_delta::text, 'sku', v.sku
            ) order by v.name, v.id), '[]'::jsonb)
            from public.product_variants v where v.product_id = p.id
          ),
          'addons', (
            select coalesce(jsonb_agg(jsonb_build_object(
              'id', a.id, 'productId', a.product_id, 'name', a.name, 'price', a.price::text
            ) order by a.name, a.id), '[]'::jsonb)
            from public.product_addons a where a.product_id = p.id
          ),
          'modifiers', (
            select coalesce(jsonb_agg(jsonb_build_object(
              'id', pm.id, 'productId', pm.product_id, 'name', pm.name,
              'options', pm.options, 'required', pm.required
            ) order by pm.name, pm.id), '[]'::jsonb)
            from public.product_modifiers pm where pm.product_id = p.id
          ),
          'pricingRules', (
            select coalesce(jsonb_agg(jsonb_build_object(
              'id', pr.id, 'productId', pr.product_id, 'name', pr.name,
              'startsAt', pr.starts_at, 'endsAt', pr.ends_at, 'price', pr.price::text
            ) order by pr.name, pr.id), '[]'::jsonb)
            from public.pricing_rules pr where pr.product_id = p.id
          ),
          'availabilityRules', (
            select coalesce(jsonb_agg(jsonb_build_object(
              'id', ar.id, 'productId', ar.product_id, 'dayOfWeek', ar.day_of_week,
              'startsAt', ar.starts_at, 'endsAt', ar.ends_at, 'isAvailable', ar.is_available
            ) order by ar.day_of_week nulls first, ar.starts_at nulls first, ar.id), '[]'::jsonb)
            from public.availability_rules ar where ar.product_id = p.id
          ),
          'nutritionProfile', null,
          'allergenProfile', null
        )
      ) order by s.sort_order, m.sort_order, p.slug), '[]'::jsonb)
      from public.menu_collection_products m
      join public.menu_collection_sections s on s.id = m.section_id
      join public.catalog_products p on p.id = m.product_id
      join public.product_categories pc on pc.id = p.category_id
      where m.collection_id = c.id and m.archived_at is null
    )
  )
  into v_snapshot
  from public.menu_collections c
  where c.id = v_collection_id;

  if coalesce(jsonb_array_length(v_snapshot -> 'products'), 0) <> 139 then
    raise exception 'Generated Staging revision does not contain 139 products.';
  end if;

  v_checksum := encode(
    digest(convert_to(pg_temp.salora_stable_json(v_snapshot), 'UTF8'), 'sha256'),
    'hex'
  );

  insert into public.menu_collection_revisions (
    id, collection_id, version, status, snapshot, checksum,
    change_summary, created_by, created_at
  ) values (
    v_revision_id, v_collection_id, 1, 'PUBLISHED'::public."MenuCollectionStatus",
    v_snapshot, v_checksum,
    'Experience 3.0 isolated Staging authority for Preview certification; catalog rows were not changed.',
    v_actor_id, v_now
  );

  update public.menu_collections
  set active_revision_id = v_revision_id, updated_at = v_now
  where id = v_collection_id;

  insert into public.menu_publications (
    id, collection_id, revision_id, publication_key, status, channels,
    published_at, completed_at, smoke_test_status, created_by, created_at
  ) values (
    v_publication_id, v_collection_id, v_revision_id,
    'experience-3-staging-menu-authority-v1',
    'PUBLISHED'::public."MenuPublicationStatus",
    array['WEB', 'DIGITAL_MENU', 'MOBILE']::text[],
    v_now, v_now, 'PENDING', v_actor_id, v_now
  );

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, before, after, reason, created_at
  ) values (
    v_actor_id, 'CREATE'::public."AuditAction", 'MenuPublication', v_publication_id,
    null,
    jsonb_build_object(
      'environment', 'staging',
      'collectionId', v_collection_id,
      'revisionId', v_revision_id,
      'productCount', 139,
      'checksum', v_checksum
    ),
    'Experience 3.0 Preview Menu Authority recovery. Production and catalog data were not modified.',
    v_now
  );
end
$bootstrap$;

commit;
