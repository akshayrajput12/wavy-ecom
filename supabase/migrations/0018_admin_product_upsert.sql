-- =============================================================================
-- 0018 — admin_upsert_product: create/replace a whole product document in ONE transaction
--   p_doc = {
--     id: uuid | null,                        -- null = create
--     product: { <products columns, snake_case>, created_by? },
--     variants: [{ id?, sku, barcode?, option1?, option2?, option3?, color_hex?, price, compare_at_price?,
--                  cost_price?, weight_grams?, low_stock_threshold?, disabled, initial_stock? }],   -- array order = position
--     media: [{ id?, url, storage_path?, alt, media_type, width?, height?, is_primary, variant_sku?, option_value? }],
--     collection_ids: [uuid]
--   }
--   Returns {id, slug}. Changing the option count rebuilds variants (stock carried over by SKU).
-- =============================================================================

create or replace function public.admin_upsert_product(p_doc jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_id       uuid := nullif(p_doc ->> 'id', '')::uuid;
  v_p        jsonb := p_doc -> 'product';
  v_keep     uuid[] := array(select (e ->> 'id')::uuid from jsonb_array_elements(p_doc -> 'variants') e
                              where coalesce(e ->> 'id', '') <> '');
  v_media    uuid[] := array(select (e ->> 'id')::uuid from jsonb_array_elements(p_doc -> 'media') e
                              where coalesce(e ->> 'id', '') <> '');
  v_cols     uuid[] := array(select jsonb_array_elements_text(coalesce(p_doc -> 'collection_ids', '[]'))::uuid);
  v_rebuild  boolean := false;
  v_carried  jsonb := '{}';          -- sku -> on_hand of variants dropped by a rebuild
  v_held     text;
  v          jsonb;
  v_i        bigint;
  v_vid      uuid;
  v_qty      integer;
  v_primary  bigint;
begin
  if not (public.is_service_role() or public.has_permission('catalog.write')) then
    raise exception 'catalog.write permission required' using errcode = '42501';
  end if;
  if jsonb_typeof(v_p) is distinct from 'object' or jsonb_typeof(p_doc -> 'variants') is distinct from 'array' then
    raise exception 'invalid_input: product and variants are required' using errcode = '22023';
  end if;

  if exists (select 1 from unnest(v_media) m where not exists (select 1 from product_media pm where pm.id = m and pm.product_id = v_id)) then
    raise exception 'unknown_media: a media id does not belong to this product' using errcode = '22023';
  end if;

  if v_id is not null then
    perform 1 from products where id = v_id for update;
    if not found then raise exception 'product_not_found' using errcode = 'P0002'; end if;
    select exists (select 1 from product_variants where product_id = v_id)
           and cardinality(p.option_names) <> jsonb_array_length(coalesce(v_p -> 'option_names', '[]'))
      into v_rebuild from products p where p.id = v_id;

    -- variants leaving the product must not hold stock for open orders (lock first: reserve_inventory locks the same rows)
    perform 1 from inventory i join product_variants pv on pv.id = i.variant_id where pv.product_id = v_id for update of i;
    select string_agg(pv.sku, ', ' order by pv.sku) into v_held
      from product_variants pv join inventory i on i.variant_id = pv.id
     where pv.product_id = v_id and i.reserved > 0 and (v_rebuild or pv.id <> all (v_keep));
    if v_held is not null then
      raise exception 'variant_has_reservations: stock is held for open orders on %', v_held using errcode = 'P0001';
    end if;

    if v_rebuild then   -- before the product update: products_before_write locks option_names while variants exist
      select coalesce(jsonb_object_agg(pv.sku, i.on_hand), '{}') into v_carried
        from product_variants pv join inventory i on i.variant_id = pv.id where pv.product_id = v_id and i.on_hand > 0;
      delete from product_variants where product_id = v_id;
    else
      delete from product_variants where product_id = v_id and id <> all (v_keep);
    end if;

    update products set (
      name, slug, category_id, brand, short_description, description, highlights, specifications, tags, badges,
      option_names, size_chart, weight_grams, length_mm, width_mm, height_mm, hsn_code, country_of_origin, warranty,
      returnable, return_window_days, return_policy, status, is_featured, sort_order, seo_title, seo_description,
      og_image_url, canonical_url, noindex
    ) = (
      select name, slug, category_id, brand, short_description, description, highlights, specifications, tags, badges,
             option_names, size_chart, weight_grams, length_mm, width_mm, height_mm, hsn_code, country_of_origin, warranty,
             returnable, return_window_days, return_policy, status, is_featured, sort_order, seo_title, seo_description,
             og_image_url, canonical_url, noindex
        from jsonb_populate_record(null::products, v_p)
    ) where id = v_id;

    -- park kept variants' unique values so SKU / barcode / option swaps inside one save don't collide
    -- (temp SKU still satisfies the sku CHECK; option1 stays non-null so the option-count trigger passes)
    update product_variants
       set sku = 'TMP-' || upper(replace(id::text, '-', '')), barcode = null,
           option1 = case when option1 is not null then 'tmp-' || id::text end
     where product_id = v_id;
  else
    insert into products (
      name, slug, category_id, brand, short_description, description, highlights, specifications, tags, badges,
      option_names, size_chart, weight_grams, length_mm, width_mm, height_mm, hsn_code, country_of_origin, warranty,
      returnable, return_window_days, return_policy, status, is_featured, sort_order, seo_title, seo_description,
      og_image_url, canonical_url, noindex, created_by
    )
    select name, slug, category_id, brand, short_description, description, highlights, specifications, tags, badges,
           option_names, size_chart, weight_grams, length_mm, width_mm, height_mm, hsn_code, country_of_origin, warranty,
           returnable, return_window_days, return_policy, status, is_featured, sort_order, seo_title, seo_description,
           og_image_url, canonical_url, noindex, created_by
      from jsonb_populate_record(null::products, v_p)
    returning id into v_id;
  end if;

  -- variants (array order = position)
  for v, v_i in select e, o from jsonb_array_elements(p_doc -> 'variants') with ordinality t(e, o) loop
    v_vid := case when v_rebuild then null else nullif(v ->> 'id', '')::uuid end;
    if v_vid is not null then
      update product_variants pv set
        sku = v ->> 'sku', barcode = v ->> 'barcode', option1 = v ->> 'option1', option2 = v ->> 'option2',
        option3 = v ->> 'option3', color_hex = v ->> 'color_hex', price = (v ->> 'price')::integer,
        compare_at_price = (v ->> 'compare_at_price')::integer, cost_price = (v ->> 'cost_price')::integer,
        weight_grams = (v ->> 'weight_grams')::integer, low_stock_threshold = (v ->> 'low_stock_threshold')::integer,
        position = v_i - 1,
        status = case when coalesce((v ->> 'disabled')::boolean, false) then 'disabled'::variant_status
                      when coalesce((select i.available from inventory i where i.variant_id = pv.id), 0) > 0 then 'active'
                      else 'out_of_stock' end
       where pv.id = v_vid and pv.product_id = v_id;
      if not found then raise exception 'unknown_variant: a variant id does not belong to this product' using errcode = '22023'; end if;
    else
      -- new rows start active; the inventory trigger flips them to out_of_stock until stock arrives
      insert into product_variants (product_id, sku, barcode, option1, option2, option3, color_hex, price, compare_at_price,
                                    cost_price, weight_grams, low_stock_threshold, position, status)
      values (v_id, v ->> 'sku', v ->> 'barcode', v ->> 'option1', v ->> 'option2', v ->> 'option3', v ->> 'color_hex',
              (v ->> 'price')::integer, (v ->> 'compare_at_price')::integer, (v ->> 'cost_price')::integer,
              (v ->> 'weight_grams')::integer, (v ->> 'low_stock_threshold')::integer, v_i - 1,
              case when coalesce((v ->> 'disabled')::boolean, false) then 'disabled'::variant_status else 'active' end)
      returning id into v_vid;
      -- inventory row comes from variants_after_write; opening stock (or stock carried over by a rebuild) goes through the ledger
      v_qty := coalesce((v_carried ->> (v ->> 'sku'))::integer, (v ->> 'initial_stock')::integer, 0);
      if v_qty > 0 then
        perform adjust_inventory(v_vid, v_qty,
          case when v_carried ? (v ->> 'sku') then 'correction' else 'initial' end::inventory_reason,
          case when v_carried ? (v ->> 'sku') then 'carried over: variant options rebuilt' else 'opening stock' end, 'manual');
      end if;
    end if;
  end loop;

  -- media: drop removed, then rewrite order + primary (clear primary first: one-primary unique index)
  delete from product_media where product_id = v_id and id <> all (v_media);
  update product_media set is_primary = false where product_id = v_id and is_primary;
  select coalesce(min(o), 1) into v_primary
    from jsonb_array_elements(coalesce(p_doc -> 'media', '[]')) with ordinality t(e, o) where (e ->> 'is_primary')::boolean;
  insert into product_media (id, product_id, url, storage_path, alt, media_type, width, height, position, is_primary,
                             variant_id, option_value)
  select coalesce(nullif(e ->> 'id', '')::uuid, gen_random_uuid()), v_id, e ->> 'url', e ->> 'storage_path',
         coalesce(e ->> 'alt', ''), coalesce(e ->> 'media_type', 'image'), (e ->> 'width')::integer, (e ->> 'height')::integer,
         o - 1, o = v_primary,
         (select pv.id from product_variants pv where pv.product_id = v_id and pv.sku = e ->> 'variant_sku'),
         e ->> 'option_value'
    from jsonb_array_elements(coalesce(p_doc -> 'media', '[]')) with ordinality t(e, o)
  on conflict (id) do update set
    url = excluded.url, storage_path = excluded.storage_path, alt = excluded.alt, media_type = excluded.media_type,
    width = excluded.width, height = excluded.height, position = excluded.position, is_primary = excluded.is_primary,
    variant_id = excluded.variant_id, option_value = excluded.option_value;

  -- collections: drop removed, append new ones at the end of each collection
  delete from collection_products where product_id = v_id and collection_id <> all (v_cols);
  insert into collection_products (collection_id, product_id, position)
  select c, v_id, coalesce((select max(cp.position) + 1 from collection_products cp where cp.collection_id = c), 0)
    from unnest(v_cols) c
  on conflict (collection_id, product_id) do nothing;

  return jsonb_build_object('id', v_id, 'slug', v_p ->> 'slug');
end $$;

revoke execute on function public.admin_upsert_product(jsonb) from public, anon;
grant execute on function public.admin_upsert_product(jsonb) to authenticated, service_role;
