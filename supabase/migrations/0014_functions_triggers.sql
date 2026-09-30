-- =============================================================================
-- 0014 — Triggers + inventory primitives
--   * updated_at on every table that has the column
--   * catalog: publish guard, spec/option guards, variant title, price range, stock -> variant
--     status, slug redirects, category/collection slug uniqueness (shared /collections/<slug>)
--   * inventory: reserve / release / commit / adjust / restock_return (row-locked, ledgered)
--   * reviews: field guard, verified_purchase (customer reviews only), rating roll-up, votes
--   * returns: request/item guards, received -> restock + order 'returned'
--   * blog publish guard, store settings guard
-- JSON returned by RPCs uses camelCase keys (matches src/types/domain.ts).
-- =============================================================================

-- ---------- updated_at everywhere ----------
do $$
declare r record;
begin
  for r in
    select c.table_name
    from information_schema.columns c
    join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name
    where c.table_schema = 'public' and c.column_name = 'updated_at' and t.table_type = 'BASE TABLE'
  loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
                   r.table_name);
  end loop;
end $$;

-- =============================================================================
-- Catalog
-- =============================================================================

-- Publishing needs catalog.publish; published_at is stamped automatically.
-- specifications must be [{group?, label, value}]; option count is locked once variants exist.
create or replace function public.products_before_write()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (tg_op = 'INSERT' and new.status <> 'draft') or (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    if not (public.is_service_role() or public.has_permission('catalog.publish')) then
      raise exception 'catalog.publish permission required to change product status' using errcode = '42501';
    end if;
  end if;
  if new.status = 'published' then new.published_at := coalesce(new.published_at, now()); end if;

  if exists (select 1 from jsonb_array_elements(new.specifications) e
              where jsonb_typeof(e) <> 'object' or coalesce(e ->> 'label', '') = '' or (e ->> 'value') is null) then
    raise exception 'invalid_specifications: expected [{group?, label, value}]' using errcode = '22023';
  end if;
  if tg_op = 'UPDATE' and cardinality(new.option_names) <> cardinality(old.option_names)
     and exists (select 1 from public.product_variants v where v.product_id = new.id) then
    raise exception 'option_names_locked: delete or rebuild variants before changing the number of options'
      using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger products_before_write before insert or update on public.products
  for each row execute function public.products_before_write();

-- [{name, value}] for a variant, in product.option_names order ('[]' for single-variant products).
create or replace function public.variant_options(p_variant_id uuid)
returns jsonb language sql stable set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('name', n.name, 'value', (array[v.option1, v.option2, v.option3])[n.i])
                            order by n.i), '[]'::jsonb)
  from public.product_variants v
  join public.products p on p.id = v.product_id
  cross join lateral unnest(p.option_names) with ordinality as n(name, i)
  where v.id = p_variant_id;
$$;

-- Variant options must match the product's option_names count; title is always derived.
create or replace function public.variants_before_write()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_names text[];
begin
  select p.option_names into v_names from public.products p where p.id = new.product_id;
  if num_nonnulls(new.option1, new.option2, new.option3) <> coalesce(cardinality(v_names), 0) then
    raise exception 'variant_options_mismatch: product expects % option value(s) (%)',
      coalesce(cardinality(v_names), 0), array_to_string(v_names, ', ') using errcode = '22023';
  end if;
  new.title := coalesce(nullif(concat_ws(' / ', new.option1, new.option2, new.option3), ''), 'Default');
  return new;
end $$;
create trigger product_variants_before_write before insert or update on public.product_variants
  for each row execute function public.variants_before_write();

-- New variant -> inventory row; any price/status change -> product price range.
create or replace function public.variants_after_write()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_product uuid;
begin
  if tg_op = 'INSERT' then
    insert into public.inventory (variant_id) values (new.id) on conflict (variant_id) do nothing;
  end if;
  foreach v_product in array array_remove(array[new.product_id, old.product_id], null) loop
    update public.products p
       set price_min = x.pmin, price_max = x.pmax, compare_at_min = x.cmin
      from (select min(v.price) as pmin, max(v.price) as pmax, min(v.compare_at_price) as cmin
              from public.product_variants v
             where v.product_id = v_product and v.status <> 'disabled') x
     where p.id = v_product
       and (p.price_min, p.price_max, p.compare_at_min) is distinct from (x.pmin, x.pmax, x.cmin);
  end loop;
  return null;
end $$;
create trigger product_variants_after_write
  after insert or delete or update of price, compare_at_price, status, product_id on public.product_variants
  for each row execute function public.variants_after_write();

-- Stock level drives active <-> out_of_stock (disabled is manual and sticky).
create or replace function public.inventory_sync_variant_status()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_status public.variant_status := case when new.available > 0 then 'active' else 'out_of_stock' end;
begin
  update public.product_variants v set status = v_status
   where v.id = new.variant_id and v.status <> 'disabled' and v.status <> v_status;
  return null;
end $$;
create trigger inventory_sync_variant_status after insert or update of on_hand, reserved on public.inventory
  for each row execute function public.inventory_sync_variant_status();

-- Cart line keeps display snapshots (checkout always re-prices server-side).
create or replace function public.cart_items_snapshot()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  select v.price, v.title into new.unit_price_snapshot, new.variant_title
    from public.product_variants v where v.id = new.variant_id;
  new.unit_price_snapshot := coalesce(new.unit_price_snapshot, 0);
  new.variant_title := coalesce(new.variant_title, '');
  new.options := public.variant_options(new.variant_id);
  update public.carts set last_activity_at = now() where id = new.cart_id;
  return new;
end $$;
create trigger cart_items_snapshot before insert or update of variant_id, quantity on public.cart_items
  for each row execute function public.cart_items_snapshot();

-- Slugs: categories and collections share /collections/<slug>, so a slug may live in only one of
-- them. Renaming a slug adds a 301 from the old URL (and repoints older redirects: no chains).
-- tg_argv[0] = URL prefix.
create or replace function public.catalog_slug_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_old text; v_new text := tg_argv[0] || new.slug;
begin
  if (tg_table_name = 'categories' and exists (select 1 from public.collections c where c.slug = new.slug))
     or (tg_table_name = 'collections' and exists (select 1 from public.categories c where c.slug = new.slug)) then
    raise exception 'slug_taken: "%" is already used under /collections', new.slug using errcode = '23505';
  end if;
  if tg_op = 'UPDATE' and new.slug is distinct from old.slug then
    v_old := tg_argv[0] || old.slug;
    delete from public.redirects where from_path = v_new;                 -- the new URL is live again
    update public.redirects set to_path = v_new, updated_at = now() where to_path = v_old;
    insert into public.redirects (from_path, to_path, status_code, created_by)
    values (v_old, v_new, 301, auth.uid())
    on conflict (from_path) do update set to_path = excluded.to_path, status_code = 301, is_active = true;
  end if;
  return new;
end $$;
create trigger products_slug_guard before insert or update of slug on public.products
  for each row execute function public.catalog_slug_guard('/products/');
create trigger categories_slug_guard before insert or update of slug on public.categories
  for each row execute function public.catalog_slug_guard('/collections/');
create trigger collections_slug_guard before insert or update of slug on public.collections
  for each row execute function public.catalog_slug_guard('/collections/');

-- =============================================================================
-- Inventory primitives. Every stock change: lock row FOR UPDATE -> check -> write -> ledger.
-- The CHECKs on inventory (on_hand >= 0, reserved >= 0, on_hand - reserved >= 0) are the final guard.
-- =============================================================================

create or replace function public.reserve_inventory(
  p_variant_id uuid,
  p_quantity integer,
  p_order_id uuid default null,
  p_checkout_session_id uuid default null,
  p_ttl interval default interval '30 minutes'      -- null = no expiry (COD / manual)
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_inv public.inventory;
  v_id  uuid;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'invalid_quantity' using errcode = '22023';
  end if;
  select * into v_inv from public.inventory where variant_id = p_variant_id for update;
  if not found then
    raise exception 'inventory_not_found' using errcode = 'P0002';
  end if;
  if v_inv.on_hand - v_inv.reserved < p_quantity then
    raise exception 'insufficient_stock' using errcode = 'P0001',
      detail = jsonb_build_object('variantId', p_variant_id, 'available', v_inv.on_hand - v_inv.reserved,
                                  'requested', p_quantity)::text;
  end if;

  update public.inventory set reserved = reserved + p_quantity
   where variant_id = p_variant_id returning * into v_inv;

  insert into public.inventory_reservations (variant_id, quantity, order_id, checkout_session_id, expires_at)
  values (p_variant_id, p_quantity, p_order_id, p_checkout_session_id, now() + p_ttl)
  returning id into v_id;

  insert into public.inventory_movements (variant_id, reason, delta_reserved, on_hand_after, reserved_after,
                                          reference_type, reference_id, actor_id)
  values (p_variant_id, 'reservation', p_quantity, v_inv.on_hand, v_inv.reserved,
          case when p_order_id is not null then 'order' else 'reservation' end, coalesce(p_order_id, v_id), auth.uid());
  return v_id;
end $$;

-- Idempotent: returns false when the reservation was not active.
create or replace function public.release_inventory(
  p_reservation_id uuid,
  p_status public.reservation_status default 'released'
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_res public.inventory_reservations;
  v_inv public.inventory;
begin
  if p_status not in ('released', 'expired') then raise exception 'invalid_release_status' using errcode = '22023'; end if;
  select * into v_res from public.inventory_reservations where id = p_reservation_id for update;
  if not found or v_res.status <> 'active' then return false; end if;

  select * into v_inv from public.inventory where variant_id = v_res.variant_id for update;
  update public.inventory set reserved = reserved - v_res.quantity
   where variant_id = v_res.variant_id returning * into v_inv;
  update public.inventory_reservations set status = p_status, released_at = now() where id = p_reservation_id;
  insert into public.inventory_movements (variant_id, reason, delta_reserved, on_hand_after, reserved_after,
                                          reference_type, reference_id, note, actor_id)
  values (v_res.variant_id, 'release', -v_res.quantity, v_inv.on_hand, v_inv.reserved,
          case when v_res.order_id is not null then 'order' else 'reservation' end,
          coalesce(v_res.order_id, v_res.id), 'reservation ' || p_status::text, auth.uid());
  return true;
end $$;

create or replace function public.release_order_inventory(
  p_order_id uuid,
  p_status public.reservation_status default 'released'
) returns integer
language plpgsql security definer set search_path = '' as $$
declare v_n integer := 0; r record;
begin
  for r in select id from public.inventory_reservations
            where order_id = p_order_id and status = 'active' order by variant_id loop
    if public.release_inventory(r.id, p_status) then v_n := v_n + 1; end if;
  end loop;
  return v_n;
end $$;

-- Payment captured / COD confirmed: reserved stock leaves the building (on_hand and reserved both drop).
create or replace function public.commit_order_inventory(p_order_id uuid)
returns integer
language plpgsql security definer set search_path = '' as $$
declare v_n integer := 0; r record; v_inv public.inventory;
begin
  for r in select * from public.inventory_reservations
            where order_id = p_order_id and status = 'active' order by variant_id for update loop
    select * into v_inv from public.inventory where variant_id = r.variant_id for update;
    update public.inventory set on_hand = on_hand - r.quantity, reserved = reserved - r.quantity
     where variant_id = r.variant_id returning * into v_inv;
    update public.inventory_reservations set status = 'consumed', consumed_at = now() where id = r.id;
    insert into public.inventory_movements (variant_id, reason, delta_on_hand, delta_reserved, on_hand_after,
                                            reserved_after, reference_type, reference_id, note)
    values (r.variant_id, 'sale', -r.quantity, -r.quantity, v_inv.on_hand, v_inv.reserved, 'order', p_order_id,
            'committed on payment');
    v_n := v_n + 1;
  end loop;
  return v_n;
end $$;

-- Manual stock adjustment (admin inventory screen). Needs inventory.write.
create or replace function public.adjust_inventory(
  p_variant_id uuid,
  p_delta integer,
  p_reason public.inventory_reason default 'adjustment',
  p_note text default null,
  p_reference_type text default 'manual',
  p_reference_id uuid default null
) returns public.inventory
language plpgsql security definer set search_path = '' as $$
declare v_inv public.inventory;
begin
  if not (public.is_service_role() or public.has_permission('inventory.write')) then
    raise exception 'inventory.write permission required' using errcode = '42501';
  end if;
  if p_delta is null or p_delta = 0 then raise exception 'invalid_delta' using errcode = '22023'; end if;
  if p_reason in ('reservation', 'release', 'sale') then
    raise exception 'reason_reserved_for_order_flow' using errcode = '22023';
  end if;
  select * into v_inv from public.inventory where variant_id = p_variant_id for update;
  if not found then raise exception 'inventory_not_found' using errcode = 'P0002'; end if;
  if v_inv.on_hand + p_delta < v_inv.reserved then
    raise exception 'insufficient_stock' using errcode = 'P0001',
      detail = format('on_hand %s + delta %s would drop below reserved %s', v_inv.on_hand, p_delta, v_inv.reserved);
  end if;
  update public.inventory set on_hand = on_hand + p_delta where variant_id = p_variant_id returning * into v_inv;
  insert into public.inventory_movements (variant_id, reason, delta_on_hand, on_hand_after, reserved_after,
                                          reference_type, reference_id, note, actor_id)
  values (p_variant_id, p_reason, p_delta, v_inv.on_hand, v_inv.reserved, p_reference_type, p_reference_id, p_note, auth.uid());
  return v_inv;
end $$;

-- Received return -> sellable items back on the shelf. Items whose condition is NULL are treated as
-- 'unused'; used/damaged/missing items are not restocked. Idempotent (return_items.restocked).
create or replace function public.restock_return(p_return_request_id uuid)
returns integer
language plpgsql security definer set search_path = '' as $$
declare v_n integer := 0; r record; v_inv public.inventory;
begin
  if not (public.is_service_role() or public.has_permission('returns.write')) then
    raise exception 'returns.write permission required' using errcode = '42501';
  end if;
  for r in
    select ri.id, oi.variant_id, ri.quantity
      from public.return_items ri
      join public.order_items oi on oi.id = ri.order_item_id
     where ri.return_request_id = p_return_request_id and not ri.restocked
       and coalesce(ri.condition, 'unused') = 'unused' and oi.variant_id is not null
     order by oi.variant_id
       for update of ri
  loop
    select * into v_inv from public.inventory where variant_id = r.variant_id for update;
    continue when not found;                                   -- variant deleted since purchase
    update public.inventory set on_hand = on_hand + r.quantity where variant_id = r.variant_id returning * into v_inv;
    insert into public.inventory_movements (variant_id, reason, delta_on_hand, on_hand_after, reserved_after,
                                            reference_type, reference_id, note, actor_id)
    values (r.variant_id, 'return', r.quantity, v_inv.on_hand, v_inv.reserved, 'return', p_return_request_id,
            'return received', auth.uid());
    update public.return_items set restocked = true where id = r.id;
    v_n := v_n + 1;
  end loop;
  return v_n;
end $$;

-- =============================================================================
-- Reviews
-- =============================================================================

-- 1) Field guard (runs first: trigger names sort alphabetically).
--    Moderators / service role may write anything (admin-authored reviews, status, verified flag).
--    Customers: own review, always source 'customer', always back to 'pending' when content changes.
create or replace function public.reviews_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if public.is_service_role() or public.has_permission('reviews.moderate') then
    if tg_op = 'UPDATE' and new.status is distinct from old.status then
      new.moderated_by := auth.uid();
      new.moderated_at := now();
    end if;
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.source := 'customer';
    new.status := 'pending';
    new.helpful_count := 0;
    new.not_helpful_count := 0;
    new.moderated_by := null; new.moderated_at := null; new.moderation_note := null;
  else
    new.user_id := old.user_id;
    new.product_id := old.product_id;
    new.source := old.source;
    new.moderated_by := old.moderated_by; new.moderated_at := old.moderated_at; new.moderation_note := old.moderation_note;
    if coalesce(current_setting('wavy.review_counters', true), 'off') <> 'on' then
      new.helpful_count := old.helpful_count;
      new.not_helpful_count := old.not_helpful_count;
    end if;
    -- edited content goes back to moderation
    new.status := case when (new.rating, new.title, new.body) is distinct from (old.rating, old.title, old.body)
                       then 'pending'::public.review_status else old.status end;
  end if;
  return new;
end $$;
create trigger reviews_10_guard before insert or update on public.reviews
  for each row execute function public.reviews_guard();

-- 2) verified_purchase for CUSTOMER reviews: true iff this user has a delivered order line for
--    this product. Admin/import reviews keep the flag they were given.
create or replace function public.reviews_set_verified_purchase()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_item uuid;
begin
  if new.source <> 'customer' then return new; end if;
  if new.user_id is not null then
    select oi.id into v_item
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.user_id = new.user_id and oi.product_id = new.product_id and o.delivered_at is not null
    order by o.delivered_at desc
    limit 1;
  end if;
  new.verified_purchase := v_item is not null;
  new.order_item_id := v_item;
  return new;
end $$;
create trigger reviews_20_verified_purchase before insert or update on public.reviews
  for each row execute function public.reviews_set_verified_purchase();

-- 3) Roll approved ratings up to products (display = override when set, see products.rating_display).
create or replace function public.reviews_rollup_rating()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_product uuid;
begin
  foreach v_product in array array_remove(array[new.product_id, old.product_id], null) loop
    update public.products p
       set rating_avg = coalesce(x.avg_rating, 0), review_count = x.cnt
      from (select round(avg(r.rating)::numeric, 2) as avg_rating, count(*)::int as cnt
              from public.reviews r where r.product_id = v_product and r.status = 'approved') x
     where p.id = v_product
       and (p.rating_avg, p.review_count) is distinct from (coalesce(x.avg_rating, 0), x.cnt);
  end loop;
  return null;
end $$;
create trigger reviews_rollup_rating after insert or delete or update of status, rating, product_id on public.reviews
  for each row execute function public.reviews_rollup_rating();

create or replace function public.review_votes_count()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_review uuid := coalesce(new.review_id, old.review_id);
begin
  perform set_config('wavy.review_counters', 'on', true);
  update public.reviews r
     set helpful_count     = (select count(*) from public.review_votes v where v.review_id = v_review and v.is_helpful),
         not_helpful_count = (select count(*) from public.review_votes v where v.review_id = v_review and not v.is_helpful)
   where r.id = v_review;
  perform set_config('wavy.review_counters', 'off', true);
  return null;
end $$;
create trigger review_votes_count after insert or update or delete on public.review_votes
  for each row execute function public.review_votes_count();

-- =============================================================================
-- Returns: customers may only return their own delivered orders, per-item return window
-- (order_items.return_window_days snapshot; 0 = not returnable).
-- =============================================================================
create or replace function public.return_requests_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_order  public.orders;
  v_window integer;
begin
  select * into v_order from public.orders where id = new.order_id;
  if not found then raise exception 'order_not_found' using errcode = 'P0002'; end if;
  if v_order.delivered_at is null then raise exception 'order_not_delivered' using errcode = 'P0001'; end if;

  if not (public.is_service_role() or public.has_permission('returns.write')) then
    if auth.uid() is null or v_order.user_id is distinct from auth.uid() then
      raise exception 'not_your_order' using errcode = '42501';
    end if;
    select max(oi.return_window_days) into v_window from public.order_items oi where oi.order_id = new.order_id;
    if coalesce(v_window, 0) = 0 or now() > v_order.delivered_at + make_interval(days => v_window) then
      raise exception 'return_window_closed' using errcode = 'P0001';
    end if;
    new.user_id := auth.uid();
    new.status := 'requested';
    new.refund_amount := null; new.reviewed_by := null; new.reviewed_at := null;
  end if;
  return new;
end $$;
create trigger return_requests_guard before insert on public.return_requests
  for each row execute function public.return_requests_guard();

create or replace function public.return_requests_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.orders set status = 'return_requested' where id = new.order_id and status = 'delivered';
  return null;
end $$;
create trigger return_requests_after_insert after insert on public.return_requests
  for each row execute function public.return_requests_after_insert();

-- Status timestamps.
create or replace function public.return_requests_before_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'received' then new.received_at := coalesce(new.received_at, now()); end if;
    if new.status in ('approved', 'rejected') then
      new.reviewed_at := coalesce(new.reviewed_at, now()); new.reviewed_by := coalesce(new.reviewed_by, auth.uid());
    end if;
    if new.status = 'closed' then new.closed_at := coalesce(new.closed_at, now()); end if;
  end if;
  return new;
end $$;
create trigger return_requests_before_update before update on public.return_requests
  for each row execute function public.return_requests_before_update();

-- received -> restock sellable items, order -> 'returned';
-- rejected with no other open request -> order back to 'delivered'.
create or replace function public.return_requests_after_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'received' then
    perform public.restock_return(new.id);
    update public.orders set status = 'returned' where id = new.order_id and status = 'return_requested';
  elsif new.status = 'rejected'
        and not exists (select 1 from public.return_requests r
                         where r.order_id = new.order_id and r.id <> new.id and r.status not in ('rejected', 'closed')) then
    update public.orders set status = 'delivered' where id = new.order_id and status = 'return_requested';
  end if;
  return null;
end $$;
create trigger return_requests_after_status after update of status on public.return_requests
  for each row when (old.status is distinct from new.status) execute function public.return_requests_after_status();

-- Item must belong to the order and be returnable; cannot return more than was bought (across open requests).
create or replace function public.return_items_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_item public.order_items; v_delivered timestamptz; v_already integer;
begin
  select oi.* into v_item
  from public.order_items oi
  join public.return_requests rr on rr.order_id = oi.order_id
  where oi.id = new.order_item_id and rr.id = new.return_request_id;
  if v_item.id is null then raise exception 'order_item_not_in_order' using errcode = 'P0001'; end if;

  if not (public.is_service_role() or public.has_permission('returns.write')) then
    select o.delivered_at into v_delivered from public.orders o where o.id = v_item.order_id;
    if v_item.return_window_days = 0 then raise exception 'item_not_returnable' using errcode = 'P0001'; end if;
    if now() > v_delivered + make_interval(days => v_item.return_window_days) then
      raise exception 'return_window_closed' using errcode = 'P0001';
    end if;
    new.restocked := false;          -- staff-only fields
    new.condition := null;
  end if;

  select coalesce(sum(ri.quantity), 0) into v_already
  from public.return_items ri
  join public.return_requests rr on rr.id = ri.return_request_id
  where ri.order_item_id = new.order_item_id and rr.status <> 'rejected' and ri.id <> new.id;
  if v_already + new.quantity > v_item.quantity then
    raise exception 'return_quantity_exceeds_purchase' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger return_items_guard before insert or update of quantity, order_item_id on public.return_items
  for each row execute function public.return_items_guard();

-- =============================================================================
-- Content + settings guards
-- =============================================================================
create or replace function public.blog_posts_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status in ('published', 'scheduled')
     and (tg_op = 'INSERT' or new.status is distinct from old.status or new.scheduled_for is distinct from old.scheduled_for)
     and not (public.is_service_role() or public.has_permission('blog.publish')) then
    raise exception 'blog.publish permission required' using errcode = '42501';
  end if;
  if new.status = 'published' then new.published_at := coalesce(new.published_at, now()); end if;
  return new;
end $$;
create trigger blog_posts_guard before insert or update on public.blog_posts
  for each row execute function public.blog_posts_guard();

-- Promote due scheduled posts (cron).
create or replace function public.publish_scheduled_posts()
returns integer language sql security definer set search_path = '' as $$
  with u as (
    update public.blog_posts set status = 'published', published_at = scheduled_for
     where status = 'scheduled' and scheduled_for <= now() returning 1)
  select count(*)::int from u;
$$;

-- home_sections.updated_by is stamped from the session.
create or replace function public.home_sections_stamp()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end $$;
create trigger home_sections_stamp before insert or update on public.home_sections
  for each row execute function public.home_sections_stamp();

-- Tax fields need settings.tax.manage, shipping/COD fields settings.shipping.manage, the rest settings.write.
create or replace function public.store_settings_guard()
returns trigger language plpgsql set search_path = '' as $$
declare
  c_tax  text[] := array['tax_percentage', 'tax_inclusive', 'gst_number'];
  c_ship text[] := array['free_shipping_threshold', 'flat_shipping_fee', 'cod_enabled', 'cod_fee', 'cod_max_order_amount'];
  v_old  jsonb := to_jsonb(old) - 'updated_at' - 'updated_by';
  v_new  jsonb := to_jsonb(new) - 'updated_at' - 'updated_by';
begin
  if not public.is_service_role() then
    if exists (select 1 from unnest(c_tax) k where v_old -> k is distinct from v_new -> k)
       and not public.has_permission('settings.tax.manage') then
      raise exception 'settings.tax.manage permission required' using errcode = '42501';
    end if;
    if exists (select 1 from unnest(c_ship) k where v_old -> k is distinct from v_new -> k)
       and not public.has_permission('settings.shipping.manage') then
      raise exception 'settings.shipping.manage permission required' using errcode = '42501';
    end if;
    if (v_old - c_tax - c_ship) is distinct from (v_new - c_tax - c_ship)
       and not public.has_permission('settings.write') then
      raise exception 'settings.write permission required' using errcode = '42501';
    end if;
  end if;
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end $$;
create trigger store_settings_guard before update on public.store_settings
  for each row execute function public.store_settings_guard();
