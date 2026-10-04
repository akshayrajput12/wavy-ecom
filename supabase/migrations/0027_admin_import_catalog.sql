-- =============================================================================
-- 0027 — admin_import_catalog: Excel catalog import (Admin > Products > Import from Excel) in ONE transaction
--   p_doc = {
--     categories:  [{ id, name, slug, parent_id, description, show_on_home, sort_order }],   -- new parents first
--     collections: [{ id, name, slug, description, is_active }],
--     products:    [{ expected_updated_at: timestamptz | null, doc: <admin_upsert_product document (0018)> }],
--     memberships: [{ collection_id, product_slug }]                                          -- additions only
--   }
--   The server validates the whole file first (src/backend/catalog-import) and generates the ids of new
--   categories/collections; existing rows were matched by slug (variants by SKU), so a re-import updates instead
--   of duplicating. Existing products keep their media and collection membership (the import never removes
--   either), and a product edited after the file was checked aborts the import (import_stale). Any error rolls
--   everything back. Returns the number of rows written per step.
--   statement_timeout: PostgREST hoists it as a transaction setting, so big files aren't cut off at the role's 8 s.
-- =============================================================================

create or replace function public.admin_import_catalog(p_doc jsonb)
returns jsonb language plpgsql security definer set search_path = public set statement_timeout = '120s' as $$
declare
  e       jsonb;
  v_doc   jsonb;
  v_id    uuid;
  v_cats  integer;
  v_cols  integer;
  v_prods integer := 0;
  v_links integer;
begin
  if not (public.is_service_role() or public.has_permission('catalog.write')) then
    raise exception 'catalog.write permission required' using errcode = '42501';
  end if;

  -- 1. categories (FK checks run at the end of the statement, so parent/child order inside it doesn't matter)
  insert into categories (id, name, slug, parent_id, description, show_on_home, sort_order)
  select r.id, r.name, r.slug, r.parent_id, r.description, r.show_on_home, r.sort_order
    from jsonb_populate_recordset(null::categories, coalesce(p_doc -> 'categories', '[]')) r
  on conflict (id) do update set
    name = excluded.name, slug = excluded.slug, parent_id = excluded.parent_id, description = excluded.description,
    show_on_home = excluded.show_on_home, sort_order = excluded.sort_order;
  get diagnostics v_cats = row_count;

  -- 2. collections
  insert into collections (id, name, slug, description, is_active)
  select r.id, r.name, r.slug, r.description, r.is_active
    from jsonb_populate_recordset(null::collections, coalesce(p_doc -> 'collections', '[]')) r
  on conflict (id) do update set
    name = excluded.name, slug = excluded.slug, description = excluded.description, is_active = excluded.is_active;
  get diagnostics v_cols = row_count;

  -- 3. products + variants (one admin_upsert_product call each: same rules as the product editor)
  for e in select x from jsonb_array_elements(coalesce(p_doc -> 'products', '[]')) x loop
    v_doc := e -> 'doc';
    v_id := nullif(v_doc ->> 'id', '')::uuid;
    if v_id is not null then
      perform 1 from products p where p.id = v_id and p.updated_at = (e ->> 'expected_updated_at')::timestamptz for update;
      if not found then
        raise exception 'import_stale: product "%" changed after the file was checked. Upload the file again.',
          v_doc -> 'product' ->> 'slug' using errcode = 'P0001';
      end if;
      v_doc := v_doc || jsonb_build_object(
        'media', coalesce((
          select jsonb_agg(jsonb_build_object(
                   'id', m.id, 'url', m.url, 'storage_path', m.storage_path, 'alt', m.alt, 'media_type', m.media_type,
                   'width', m.width, 'height', m.height, 'is_primary', m.is_primary, 'option_value', m.option_value,
                   'variant_sku', (select pv.sku from product_variants pv where pv.id = m.variant_id)) order by m.position)
            from product_media m where m.product_id = v_id), '[]'),
        'collection_ids', coalesce((select jsonb_agg(cp.collection_id) from collection_products cp where cp.product_id = v_id), '[]'));
    end if;
    perform admin_upsert_product(v_doc);
    v_prods := v_prods + 1;
  end loop;

  -- 4. collection memberships, appended after each collection's current last position
  insert into collection_products (collection_id, product_id, position)
  select m.collection_id, p.id,
         coalesce((select max(cp.position) from collection_products cp where cp.collection_id = m.collection_id), -1)
           + row_number() over (partition by m.collection_id order by m.ord)
    from (select (x ->> 'collection_id')::uuid as collection_id, x ->> 'product_slug' as product_slug, o as ord
            from jsonb_array_elements(coalesce(p_doc -> 'memberships', '[]')) with ordinality t(x, o)) m
    join products p on p.slug = m.product_slug
  on conflict (collection_id, product_id) do nothing;
  get diagnostics v_links = row_count;

  return jsonb_build_object('categories', v_cats, 'collections', v_cols, 'products', v_prods, 'memberships', v_links);
end $$;

revoke execute on function public.admin_import_catalog(jsonb) from public, anon;
grant execute on function public.admin_import_catalog(jsonb) to authenticated, service_role;
