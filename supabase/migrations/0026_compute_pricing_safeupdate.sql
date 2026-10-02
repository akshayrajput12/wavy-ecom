-- =============================================================================
-- 0026 — compute_pricing: qualify every UPDATE (pg-safeupdate)
--
-- Supabase loads pg-safeupdate for PostgREST sessions: an UPDATE/DELETE without a WHERE clause raises
-- 21000 "UPDATE requires a WHERE clause", including inside functions called over /rpc. compute_pricing (0015)
-- had three such updates on its pg_temp._pricing_units scratch table:
--   * offers loop "set eligible = ..."      -> ANY active offer made EVERY quote fail (bag totals, checkout,
--                                              place_order all 500 "Could not price the cart")
--   * coupon "set eligible = ..."           -> every applicable coupon failed
--   * coupon "set coupon_discount = 0"      -> every unknown/invalid coupon failed (instead of coupon.error)
-- Fix: the same function with `where true` on those three statements (the table only holds this call's units).
-- Body otherwise identical to 0015. Re-runnable (create or replace, same signature and grants).
-- =============================================================================

create or replace function public.compute_pricing(
  p_items jsonb,
  p_coupon_code text default null,
  p_user_id uuid default null,
  p_email text default null,
  p_shipping_method_id uuid default null,
  p_payment_provider public.payment_provider default null,
  p_state text default null,
  p_lock boolean default false
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  s             public.store_settings;
  c             public.coupons;
  o             public.offers;
  m             public.shipping_methods;
  v_lines       jsonb := '[]';
  v_errors      jsonb := '[]';
  v_applied     jsonb := '[]';
  v_nudges      jsonb := '[]';
  v_coupon      jsonb := null;
  v_subtotal    integer := 0;
  v_offer_disc  integer := 0;
  v_coupon_disc integer := 0;
  v_shipping    integer := 0;
  v_cod_fee     integer := 0;
  v_tax         integer := 0;
  v_total       integer;
  v_net         integer;
  v_taxable     integer;
  v_threshold   integer;
  v_free_ship   boolean := false;
  v_n           integer;
  v_group       integer;
  v_sets        integer;
  v_used        integer;
  v_pct         integer;
  v_need        integer;
  v_amount      integer;
  v_base        integer;
  v_err         text;
begin
  select * into s from public.store_settings where id;

  create temp table if not exists _pricing_units (
    unit_no         integer primary key,
    variant_id      uuid,
    product_id      uuid,
    category_path   uuid[],
    collection_ids  uuid[],
    unit_price      integer,
    eligible        boolean not null default false,
    offer_id        uuid,
    offer_discount  integer not null default 0,
    coupon_discount integer not null default 0
  ) on commit drop;
  truncate pg_temp._pricing_units;

  -- 1. Resolve lines from the database.
  with req as (
    select (e ->> 'variantId')::uuid as variant_id, sum(coalesce((e ->> 'quantity')::int, 0))::int as qty, min(ord) as ord
    from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) with ordinality as t(e, ord)
    group by 1
  ), j as (
    select r.variant_id, r.qty, r.ord, v.sku, v.title, v.price, v.compare_at_price, v.status as vstatus,
           p.id as product_id, p.name, p.brand, p.slug, p.status as pstatus, p.category_id, p.hsn_code, i.available,
           case when p.returnable then coalesce(p.return_window_days, s.return_window_days) else 0 end as return_days,
           (select pm.url from public.product_media pm where pm.product_id = p.id
             order by (pm.variant_id = v.id) is true desc,
                      (pm.option_value in (v.option1, v.option2, v.option3)) is true desc,
                      pm.is_primary desc, pm.position limit 1) as image_url,
           case
             when v.id is null then 'variant_not_found'
             when p.status <> 'published' or v.status = 'disabled' then 'unavailable'
             when r.qty < 1 or r.qty > 10 then 'invalid_quantity'
             when coalesce(i.available, 0) < r.qty then 'insufficient_stock'
           end as err
    from req r
    left join public.product_variants v on v.id = r.variant_id
    left join public.products p on p.id = v.product_id
    left join public.inventory i on i.variant_id = v.id
  )
  select
    coalesce(jsonb_agg(jsonb_build_object(
      'variantId', variant_id, 'productId', product_id, 'categoryId', category_id, 'sku', sku, 'name', name,
      'brand', brand, 'slug', slug, 'variantTitle', title, 'options', public.variant_options(variant_id),
      'image', image_url, 'unitPrice', price, 'compareAtPrice', compare_at_price, 'quantity', qty,
      'maxQuantity', least(coalesce(available, 0), 10), 'lineSubtotal', price * qty,
      'hsnCode', hsn_code, 'returnWindowDays', return_days) order by ord)
      filter (where err is null), '[]'),
    coalesce(jsonb_agg(jsonb_build_object('variantId', variant_id, 'code', err, 'available', coalesce(available, 0)) order by ord)
      filter (where err is not null), '[]')
  into v_lines, v_errors
  from j;

  -- 2. Expand into units (one row per piece) for offer/coupon allocation.
  insert into pg_temp._pricing_units (unit_no, variant_id, product_id, category_path, collection_ids, unit_price)
  select row_number() over (),
         (l ->> 'variantId')::uuid,
         (l ->> 'productId')::uuid,
         public.category_path((l ->> 'categoryId')::uuid),
         coalesce((select array_agg(cp.collection_id) from public.collection_products cp
                    where cp.product_id = (l ->> 'productId')::uuid), '{}'),
         (l ->> 'unitPrice')::int
  from jsonb_array_elements(v_lines) l, generate_series(1, (l ->> 'quantity')::int);
  select coalesce(sum(unit_price), 0) into v_subtotal from pg_temp._pricing_units;

  -- 3. Offers.
  for o in
    select * from public.offers
    where status = 'active'
      and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())
      and (usage_limit_total is null or usage_count < usage_limit_total)
    order by priority desc, created_at
  loop
    update pg_temp._pricing_units u
       set eligible = (u.offer_id is null
                       and public.discount_target_match(null, o.id, u.product_id, u.variant_id, u.category_path, u.collection_ids))
     where true;
    select count(*) into v_n from pg_temp._pricing_units where eligible;
    continue when v_n = 0;
    v_sets := 0;

    if o.type = 'bundle_fixed_price' then
      v_group := o.required_qty;
      v_sets := least(v_n / v_group, coalesce(o.max_applications_per_order, 1000000));
      with pick as (
        select unit_no, unit_price,
               (row_number() over (order by unit_price desc, unit_no) - 1) / v_group as set_no
        from pg_temp._pricing_units where eligible
      ), st as (
        select set_no, sum(unit_price)::int as total from pick
        where set_no < v_sets group by set_no having sum(unit_price) > o.bundle_price
      ), alloc as (
        select p.unit_no, p.set_no, st.total - o.bundle_price as set_disc,
               (p.unit_price::bigint * (st.total - o.bundle_price) / st.total)::int as d,
               row_number() over (partition by p.set_no order by p.unit_no) as k
        from pick p join st using (set_no)
      ), fin as (
        select unit_no, d + case when k = 1 then set_disc - (sum(d) over (partition by set_no))::int else 0 end as d
        from alloc
      )
      update pg_temp._pricing_units u set offer_id = o.id, offer_discount = fin.d
        from fin where u.unit_no = fin.unit_no;
      get diagnostics v_used = row_count;
      v_sets := v_used / v_group;
      if v_n % v_group <> 0 and (o.max_applications_per_order is null or v_sets < o.max_applications_per_order) then
        v_need := v_group - v_n % v_group;
      else
        v_need := null;
      end if;

    elsif o.type = 'bogo' then
      v_group := o.buy_qty + o.get_qty;
      v_sets := least(v_n / v_group, coalesce(o.max_applications_per_order, 1000000));
      with pick as (
        select unit_no, unit_price, row_number() over (order by unit_price desc, unit_no) - 1 as rn
        from pg_temp._pricing_units where eligible
      )
      update pg_temp._pricing_units u
         set offer_id = o.id,
             offer_discount = case when p.rn % v_group >= o.buy_qty
                                   then (p.unit_price::bigint * o.get_discount_percent / 100)::int else 0 end
        from pick p where u.unit_no = p.unit_no and p.rn < v_sets * v_group;
      if v_n % v_group <> 0 and (o.max_applications_per_order is null or v_sets < o.max_applications_per_order) then
        v_need := v_group - v_n % v_group;
      else
        v_need := null;
      end if;

    elsif o.type = 'tiered_percent' then
      select max((t ->> 'percent')::int) into v_pct
      from jsonb_array_elements(o.tiers) t where (t ->> 'min_qty')::int <= v_n;
      if v_pct is not null then
        update pg_temp._pricing_units u set offer_id = o.id,
               offer_discount = (u.unit_price::bigint * v_pct / 100)::int
         where eligible;
        v_sets := 1;
      end if;
      select (t ->> 'min_qty')::int - v_n into v_need
      from jsonb_array_elements(o.tiers) t
      where (t ->> 'min_qty')::int > v_n and (t ->> 'percent')::int > coalesce(v_pct, 0)
      order by (t ->> 'min_qty')::int limit 1;
    end if;

    select coalesce(sum(offer_discount), 0) into v_amount from pg_temp._pricing_units where offer_id = o.id;
    if v_amount > 0 then
      v_applied := v_applied || jsonb_build_object('kind', 'offer', 'id', o.id, 'name', o.name, 'type', o.type,
                                                   'amount', v_amount, 'applications', greatest(v_sets, 1));
    else
      update pg_temp._pricing_units set offer_id = null, offer_discount = 0 where offer_id = o.id;
    end if;
    if v_need is not null and v_need > 0 then
      v_nudges := v_nudges || jsonb_build_object(
        'offerId', o.id, 'itemsNeeded', v_need,
        'message', replace(replace(coalesce(o.nudge_template, 'Add {n} more to unlock {offer}'), '{n}', v_need::text), '{offer}', o.name));
    end if;
  end loop;
  select coalesce(sum(offer_discount), 0) into v_offer_disc from pg_temp._pricing_units;

  -- 4. Coupon.
  if nullif(trim(coalesce(p_coupon_code, '')), '') is not null then
    if p_lock then
      select * into c from public.coupons where upper(code) = upper(trim(p_coupon_code)) for update;
    else
      select * into c from public.coupons where upper(code) = upper(trim(p_coupon_code));
    end if;

    v_err := case
      when c.id is null then 'coupon_not_found'
      when c.status <> 'active' then 'coupon_inactive'
      when c.starts_at is not null and c.starts_at > now() then 'coupon_not_started'
      when c.ends_at is not null and c.ends_at <= now() then 'coupon_expired'
      when c.usage_limit_total is not null
           and (select count(*) from public.coupon_redemptions r
                 where r.coupon_id = c.id and r.status <> 'reversed') >= c.usage_limit_total then 'coupon_usage_limit_reached'
      when c.usage_limit_per_user is not null and (p_user_id is not null or p_email is not null)
           and (select count(*) from public.coupon_redemptions r
                 where r.coupon_id = c.id and r.status <> 'reversed'
                   and (r.user_id = p_user_id or lower(r.email) = lower(p_email))) >= c.usage_limit_per_user then 'coupon_already_used'
      when c.first_order_only and (p_user_id is not null or p_email is not null)
           and exists (select 1 from public.orders x
                        where (x.user_id = p_user_id or lower(x.email) = lower(p_email))
                          and x.status not in ('cancelled', 'pending_payment')) then 'coupon_first_order_only'
      when v_subtotal - v_offer_disc < c.min_order_amount then 'coupon_min_order_not_met'
    end;

    if v_err is null then
      update pg_temp._pricing_units u
         set eligible = public.discount_target_match(c.id, null, u.product_id, u.variant_id, u.category_path, u.collection_ids)
                        and (c.combinable_with_offers or u.offer_id is null)
       where true;
      select coalesce(sum(unit_price - offer_discount), 0) into v_base from pg_temp._pricing_units where eligible;

      -- every coupon type (free shipping included) needs at least one eligible item
      if v_base <= 0 then
        v_err := 'coupon_not_applicable';
      elsif c.type = 'free_shipping' then
        v_free_ship := true;
      else
        v_coupon_disc := case c.type
          when 'percent' then least((v_base::bigint * c.value / 100)::int, coalesce(c.max_discount_amount, v_base))
          else least(c.value, v_base) end;
        with e as (
          select unit_no, unit_price - offer_discount as net, row_number() over (order by unit_no) as k
          from pg_temp._pricing_units where eligible
        ), a as (
          select unit_no, k, (net::bigint * v_coupon_disc / v_base)::int as d from e
        ), f as (
          select unit_no, d + case when k = 1 then v_coupon_disc - (sum(d) over ())::int else 0 end as d from a
        )
        update pg_temp._pricing_units u set coupon_discount = f.d from f where u.unit_no = f.unit_no;
      end if;
    end if;

    if v_err is not null then
      v_coupon_disc := 0;
      v_free_ship := false;
      update pg_temp._pricing_units set coupon_discount = 0 where true;
    end if;
    v_coupon := jsonb_build_object('id', c.id, 'code', coalesce(c.code, upper(trim(p_coupon_code))), 'type', c.type,
                                   'valid', v_err is null, 'error', v_err, 'discount', v_coupon_disc,
                                   'freeShipping', v_free_ship);
    if v_err is null then
      v_applied := v_applied || jsonb_build_object('kind', 'coupon', 'id', c.id, 'code', c.code,
                                                   'amount', v_coupon_disc, 'freeShipping', v_free_ship);
    end if;
  end if;

  -- 5. Shipping.
  v_net := v_subtotal - v_offer_disc - v_coupon_disc;
  if p_shipping_method_id is not null then
    select * into m from public.shipping_methods where id = p_shipping_method_id and is_active;
    if m.id is null then v_errors := v_errors || jsonb_build_object('code', 'shipping_method_unavailable'); end if;
  else
    select sm.* into m
    from public.shipping_methods sm
    join public.shipping_zones z on z.id = sm.zone_id
    where sm.is_active and z.is_active
      and (z.is_default or exists (select 1 from unnest(z.states) st where lower(st) = lower(p_state)))
    order by exists (select 1 from unnest(z.states) st where lower(st) = lower(p_state)) desc, sm.sort_order, sm.rate
    limit 1;
  end if;
  v_threshold := coalesce(m.free_above, s.free_shipping_threshold);
  v_shipping := case
    when v_subtotal = 0 or v_free_ship then 0
    when v_threshold is not null and v_net >= v_threshold then 0
    else coalesce(m.rate, s.flat_shipping_fee) end;

  -- 6. Payment method rules.
  if p_payment_provider is not null
     and not coalesce((select g.is_enabled from public.payment_gateways g where g.provider = p_payment_provider), false) then
    v_errors := v_errors || jsonb_build_object('code', 'gateway_disabled', 'provider', p_payment_provider);
  end if;
  if p_payment_provider = 'cod' then
    if not s.cod_enabled or (m.id is not null and not m.cod_available) then
      v_errors := v_errors || jsonb_build_object('code', 'cod_unavailable');
    else
      v_cod_fee := s.cod_fee;
    end if;
  end if;

  -- 7. Tax + total.
  v_taxable := v_net + v_shipping + v_cod_fee;
  if s.tax_inclusive then
    v_tax := round(v_taxable - v_taxable / (1 + s.tax_percentage / 100.0));
  else
    v_tax := round(v_taxable * s.tax_percentage / 100.0);
  end if;
  v_total := v_taxable + case when s.tax_inclusive then 0 else v_tax end;

  if p_payment_provider = 'cod' and s.cod_max_order_amount is not null and v_total > s.cod_max_order_amount then
    v_errors := v_errors || jsonb_build_object('code', 'cod_limit_exceeded', 'max', s.cod_max_order_amount);
  end if;
  if jsonb_array_length(v_lines) = 0 and jsonb_array_length(v_errors) = 0 then
    v_errors := v_errors || jsonb_build_object('code', 'empty_cart');
  end if;

  -- 8. Per-line discount allocation.
  select coalesce(jsonb_agg(l || jsonb_build_object('discount', d.disc, 'lineTotal', (l ->> 'lineSubtotal')::int - d.disc)
                            order by ord), '[]')
    into v_lines
  from jsonb_array_elements(v_lines) with ordinality t(l, ord)
  cross join lateral (
    select coalesce(sum(u.offer_discount + u.coupon_discount), 0)::int as disc
    from pg_temp._pricing_units u where u.variant_id = (l ->> 'variantId')::uuid) d;

  return jsonb_build_object(
    'valid', jsonb_array_length(v_errors) = 0,
    'errors', v_errors,
    'currency', s.currency,
    'lines', v_lines,
    'subtotal', v_subtotal,
    'offerDiscount', v_offer_disc,
    'couponDiscount', v_coupon_disc,
    'discount', v_offer_disc + v_coupon_disc,
    'shipping', v_shipping,
    'codFee', v_cod_fee,
    'tax', v_tax,
    'taxRate', s.tax_percentage,
    'taxInclusive', s.tax_inclusive,
    'total', v_total,
    'appliedCoupon', case when (v_coupon ->> 'valid')::boolean then v_coupon ->> 'code' end,
    'coupon', v_coupon,
    'appliedDiscounts', v_applied,
    'offerNudges', v_nudges,
    'shippingMethod', case when m.id is not null then jsonb_build_object('id', m.id, 'code', m.code, 'name', m.name,
                                                                        'rate', m.rate, 'minDays', m.min_days, 'maxDays', m.max_days) end
  );
end $$;
