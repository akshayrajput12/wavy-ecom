-- =============================================================================
-- 0015 — Commerce RPCs (server-authoritative pricing, orders, payments, tracking)
--   compute_pricing / quote_cart / apply_coupon
--   place_order            idempotent on idempotency_key
--   start_payment_attempt / record_payment_failure / mark_payment_captured (idempotent)
--   reconcile_order_payment, cancel_order, release_expired_reservations
--   get_order_tracking(token)  public, safe fields only
--   get_customer_journey(user) support timeline
-- Order status transitions + history, refund bookkeeping triggers.
-- =============================================================================

-- ---------- discount targeting ----------
create or replace function public.discount_target_match(
  p_coupon_id uuid, p_offer_id uuid, p_product_id uuid, p_category_path uuid[], p_collection_ids uuid[]
) returns boolean language sql stable set search_path = '' as $$
  with t as (
    select * from public.discount_targets d
    where (p_coupon_id is not null and d.coupon_id = p_coupon_id) or (p_offer_id is not null and d.offer_id = p_offer_id)
  )
  select (not exists (select 1 from t where t.mode = 'include')
          or exists (select 1 from t where t.mode = 'include'
                       and (t.product_id = p_product_id or t.category_id = any (p_category_path)
                            or t.collection_id = any (p_collection_ids))))
     and not exists (select 1 from t where t.mode = 'exclude'
                       and (t.product_id = p_product_id or t.category_id = any (p_category_path)
                            or t.collection_id = any (p_collection_ids)));
$$;

-- =============================================================================
-- compute_pricing: THE price authority. Client prices are never read.
-- p_items: [{"variantId": uuid, "quantity": int}]
-- Returns CartTotals-shaped jsonb (camelCase):
--   {valid, errors[], lines[], subtotal, offerDiscount, couponDiscount, discount, shipping, codFee,
--    tax, taxRate, taxInclusive, total, currency, appliedCoupon, coupon{}, appliedDiscounts[],
--    offerNudges[{offerId,message,itemsNeeded}], shippingMethod{}}
-- Offer rules: each unit gets at most one offer (priority desc). Bundles/BOGO group the most
-- expensive eligible units first (customer-favourable). Coupon applies after offers.
-- Tax: single store rate. Inclusive -> tax is the GST contained in the price.
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
    select r.variant_id, r.qty, r.ord, v.sku, v.color, v.size, v.price, v.compare_at, v.status as vstatus,
           p.id as product_id, p.name, p.slug, p.status as pstatus, p.category_id, i.available,
           (select pm.url from public.product_media pm where pm.product_id = p.id
             order by (pm.color is not distinct from v.color) desc, pm.is_primary desc, pm.sort_order limit 1) as image_url,
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
      'slug', slug, 'color', color, 'size', size, 'image', image_url, 'unitPrice', price, 'compareAt', compare_at,
      'quantity', qty, 'maxQuantity', least(coalesce(available, 0), 10), 'lineSubtotal', price * qty) order by ord)
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
                       and public.discount_target_match(null, o.id, u.product_id, u.category_path, u.collection_ids));
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
         set eligible = public.discount_target_match(c.id, null, u.product_id, u.category_path, u.collection_ids)
                        and (c.combinable_with_offers or u.offer_id is null);
      select coalesce(sum(unit_price - offer_discount), 0) into v_base from pg_temp._pricing_units where eligible;

      if c.type = 'free_shipping' then
        v_free_ship := v_subtotal > 0;
      elsif v_base <= 0 then
        v_err := 'coupon_not_applicable';
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
      update pg_temp._pricing_units set coupon_discount = 0;
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

-- Quote a stored cart. Owner (signed-in) or service role only.
create or replace function public.quote_cart(
  p_cart_id uuid,
  p_shipping_method_id uuid default null,
  p_payment_provider public.payment_provider default null,
  p_state text default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_cart public.carts; v_items jsonb; v_email text;
begin
  select * into v_cart from public.carts where id = p_cart_id;
  if not found or not (public.is_service_role() or (auth.uid() is not null and v_cart.user_id = auth.uid())) then
    raise exception 'cart_not_found' using errcode = 'P0002';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('variantId', ci.variant_id, 'quantity', ci.quantity) order by ci.created_at), '[]')
    into v_items from public.cart_items ci where ci.cart_id = p_cart_id;
  select p.email into v_email from public.profiles p where p.id = v_cart.user_id;
  return public.compute_pricing(v_items, v_cart.coupon_code, v_cart.user_id, v_email,
                                p_shipping_method_id, p_payment_provider, p_state);
end $$;

-- Validate + attach (or clear with null) a coupon on a cart. Returns the new quote.
create or replace function public.apply_coupon(p_cart_id uuid, p_code text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_cart public.carts; v_quote jsonb; v_items jsonb; v_email text;
begin
  select * into v_cart from public.carts where id = p_cart_id and status = 'active' for update;
  if not found or not (public.is_service_role() or (auth.uid() is not null and v_cart.user_id = auth.uid())) then
    raise exception 'cart_not_found' using errcode = 'P0002';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('variantId', ci.variant_id, 'quantity', ci.quantity)), '[]')
    into v_items from public.cart_items ci where ci.cart_id = p_cart_id;
  select p.email into v_email from public.profiles p where p.id = v_cart.user_id;
  v_quote := public.compute_pricing(v_items, p_code, v_cart.user_id, v_email);
  if p_code is null or coalesce((v_quote -> 'coupon' ->> 'valid')::boolean, false) then
    update public.carts set coupon_code = case when p_code is null then null else v_quote -> 'coupon' ->> 'code' end,
                            last_activity_at = now()
     where id = p_cart_id;
  end if;
  return v_quote;
end $$;

-- =============================================================================
-- Order state machine + history
-- =============================================================================
create or replace function public.order_status_allowed(p_from public.order_status, p_to public.order_status)
returns boolean language sql immutable set search_path = '' as $$
  select p_from = p_to or (p_from, p_to) in (
    ('pending_payment', 'paid'), ('pending_payment', 'processing'), ('pending_payment', 'cancelled'),
    ('paid', 'processing'), ('paid', 'cancelled'), ('paid', 'refunded'),
    ('processing', 'packed'), ('processing', 'shipped'), ('processing', 'cancelled'),
    ('packed', 'shipped'), ('packed', 'cancelled'),
    ('shipped', 'delivered'), ('shipped', 'cancelled'),
    ('delivered', 'return_requested'), ('delivered', 'refunded'),
    ('return_requested', 'returned'), ('return_requested', 'delivered'), ('return_requested', 'refunded'),
    ('returned', 'refunded'),
    ('cancelled', 'refunded')
  );
$$;

create or replace function public.orders_before_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    if not public.order_status_allowed(old.status, new.status) then
      raise exception 'invalid_order_transition % -> %', old.status, new.status using errcode = 'P0001';
    end if;
    if new.status = 'delivered' then
      new.delivered_at := coalesce(new.delivered_at, now());
      if new.payment_provider = 'cod' and new.payment_status = 'initiated' then new.payment_status := 'captured'; end if;
    end if;
    if new.status = 'cancelled' then new.cancelled_at := coalesce(new.cancelled_at, now()); end if;
    if new.status = 'paid' then new.paid_at := coalesce(new.paid_at, now()); end if;
  end if;
  -- money snapshot is immutable after placement
  if (new.subtotal, new.discount_total, new.shipping_total, new.cod_fee, new.tax_total, new.total)
     is distinct from (old.subtotal, old.discount_total, old.shipping_total, old.cod_fee, old.tax_total, old.total) then
    raise exception 'order totals are immutable' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger orders_before_update before update on public.orders
  for each row execute function public.orders_before_update();

create or replace function public.orders_after_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.order_status_history (order_id, from_status, to_status, actor_id, actor_type, note)
  values (new.id, case when tg_op = 'UPDATE' then old.status end, new.status, auth.uid(),
          case when auth.jwt() ->> 'role' = 'service_role' or auth.uid() is null then 'system'
               when public.is_staff() then 'staff' else 'customer' end,
          nullif(current_setting('wavy.status_note', true), ''));
  -- COD cash collected on delivery
  if tg_op = 'UPDATE' and new.status = 'delivered' and new.payment_provider = 'cod' then
    update public.payments set status = 'captured', amount_captured = amount, captured_at = now()
     where order_id = new.id and provider = 'cod' and status = 'initiated';
  end if;
  return null;
end $$;
create trigger orders_after_status after insert or update of status on public.orders
  for each row when (pg_trigger_depth() < 5) execute function public.orders_after_status();

-- Side effects once an order is confirmed (online capture or COD placement).
create or replace function public.confirm_order_side_effects(p_order_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id;
  perform public.commit_order_inventory(p_order_id);
  update public.coupons c set usage_count = usage_count + 1
    from public.coupon_redemptions r
   where r.order_id = p_order_id and r.coupon_id = c.id and r.status = 'reserved';
  update public.coupon_redemptions set status = 'applied' where order_id = p_order_id and status = 'reserved';
  update public.offers x set usage_count = usage_count + 1
    from public.offer_redemptions r
   where r.order_id = p_order_id and r.offer_id = x.id and r.status = 'reserved';
  update public.offer_redemptions set status = 'applied' where order_id = p_order_id and status = 'reserved';
  if v_order.cart_id is not null then
    update public.carts set status = 'converted', converted_order_id = p_order_id
     where id = v_order.cart_id and status = 'active';
  end if;
  update public.checkout_sessions set status = 'completed', completed_at = now()
   where order_id = p_order_id and status <> 'completed';
end $$;

create or replace function public.order_json(o public.orders)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('orderId', o.id, 'orderNumber', o.order_number, 'status', o.status,
                            'paymentStatus', o.payment_status, 'paymentProvider', o.payment_provider,
                            'total', o.total, 'trackingToken', o.tracking_token,
                            'paymentId', (select p.id from public.payments p where p.order_id = o.id
                                           and p.provider = o.payment_provider));
$$;

-- =============================================================================
-- place_order: idempotent. Same key -> same order (replayed = true), never a second order.
-- p_payload (camelCase): {userId?, email, phone, customerName, shippingAddress{name,phone,line1,line2,city,state,
--   postalCode,country}, billingAddress?, items?[{variantId,quantity}] | cartId, checkoutSessionId?, couponCode?,
--   shippingMethodId?, paymentProvider, notes?, customerIp?, userAgent?, visitorSessionId?}
-- =============================================================================
create or replace function public.place_order(p_idempotency_key text, p_payload jsonb)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  s          public.store_settings;
  v_order    public.orders;
  v_quote    jsonb;
  v_items    jsonb := p_payload -> 'items';
  v_user     uuid := nullif(p_payload ->> 'userId', '')::uuid;
  v_email    text := lower(trim(p_payload ->> 'email'));
  v_addr     jsonb := p_payload -> 'shippingAddress';
  v_cart     uuid := nullif(p_payload ->> 'cartId', '')::uuid;
  v_checkout uuid := nullif(p_payload ->> 'checkoutSessionId', '')::uuid;
  v_provider public.payment_provider := nullif(p_payload ->> 'paymentProvider', '')::public.payment_provider;
  v_phone    text;
  v_line     jsonb;
  v_ttl      interval;
begin
  if p_idempotency_key is null or char_length(p_idempotency_key) not between 8 and 200 then
    raise exception 'invalid_idempotency_key' using errcode = '22023';
  end if;
  -- serialise concurrent retries of the same key, then replay if it already exists
  perform pg_advisory_xact_lock(hashtextextended('place_order:' || p_idempotency_key, 0));
  select * into v_order from public.orders where idempotency_key = p_idempotency_key;
  if found then
    return public.order_json(v_order) || jsonb_build_object('replayed', true);
  end if;

  if (v_items is null or jsonb_array_length(v_items) = 0) and v_cart is not null then
    select jsonb_agg(jsonb_build_object('variantId', ci.variant_id, 'quantity', ci.quantity))
      into v_items from public.cart_items ci where ci.cart_id = v_cart;
  end if;
  if v_items is null or jsonb_array_length(v_items) = 0 then
    raise exception 'empty_cart' using errcode = 'P0001';
  end if;
  v_phone := regexp_replace(coalesce(p_payload ->> 'phone', v_addr ->> 'phone', ''), '[^0-9+]', '', 'g');
  if v_email is null or v_provider is null or v_addr is null or jsonb_typeof(v_addr) <> 'object'
     or coalesce(v_addr ->> 'line1', '') = '' or coalesce(v_addr ->> 'city', '') = ''
     or coalesce(v_addr ->> 'postalCode', '') = '' or v_phone = '' then
    raise exception 'invalid_payload' using errcode = '22023',
      detail = 'email, phone, paymentProvider and shippingAddress{line1,city,state,postalCode} are required';
  end if;

  -- lock stock rows in a stable order (prevents deadlocks between concurrent checkouts)
  perform 1 from public.inventory
   where variant_id in (select (e ->> 'variantId')::uuid from jsonb_array_elements(v_items) e)
   order by variant_id for update;

  v_quote := public.compute_pricing(v_items, p_payload ->> 'couponCode', v_user, v_email,
                                    nullif(p_payload ->> 'shippingMethodId', '')::uuid, v_provider,
                                    v_addr ->> 'state', true);
  if not (v_quote ->> 'valid')::boolean then
    raise exception 'pricing_invalid' using errcode = 'P0001', detail = (v_quote -> 'errors')::text;
  end if;
  if jsonb_typeof(v_quote -> 'coupon') = 'object' and not (v_quote -> 'coupon' ->> 'valid')::boolean then
    raise exception 'coupon_invalid' using errcode = 'P0001', detail = v_quote -> 'coupon' ->> 'error';
  end if;

  select * into s from public.store_settings where id;

  insert into public.orders (
    idempotency_key, checkout_session_id, cart_id, user_id, visitor_session_id, payment_provider,
    email, phone, customer_name, shipping_address, billing_address, shipping_method_id, shipping_method_name,
    currency, subtotal, discount_total, shipping_total, cod_fee, tax_total, total, tax_rate, tax_inclusive,
    coupon_id, coupon_code, applied_discounts, pricing_snapshot, notes, customer_ip, user_agent)
  values (
    p_idempotency_key, v_checkout, v_cart, v_user, nullif(p_payload ->> 'visitorSessionId', '')::uuid, v_provider,
    v_email, v_phone, coalesce(nullif(p_payload ->> 'customerName', ''), v_addr ->> 'name', v_email), v_addr,
    p_payload -> 'billingAddress',
    (v_quote -> 'shippingMethod' ->> 'id')::uuid, v_quote -> 'shippingMethod' ->> 'name',
    v_quote ->> 'currency', (v_quote ->> 'subtotal')::int, (v_quote ->> 'discount')::int, (v_quote ->> 'shipping')::int,
    (v_quote ->> 'codFee')::int, (v_quote ->> 'tax')::int, (v_quote ->> 'total')::int,
    (v_quote ->> 'taxRate')::numeric, (v_quote ->> 'taxInclusive')::boolean,
    (v_quote -> 'coupon' ->> 'id')::uuid, v_quote -> 'coupon' ->> 'code', v_quote -> 'appliedDiscounts', v_quote,
    p_payload ->> 'notes', nullif(p_payload ->> 'customerIp', '')::inet, p_payload ->> 'userAgent')
  returning * into v_order;

  insert into public.order_items (order_id, product_id, variant_id, sku, product_name, color, size, image_url,
                                  unit_price, compare_at, quantity, line_subtotal, discount_allocated, line_total)
  select v_order.id, (l ->> 'productId')::uuid, (l ->> 'variantId')::uuid, l ->> 'sku', l ->> 'name', l ->> 'color',
         l ->> 'size', l ->> 'image', (l ->> 'unitPrice')::int, (l ->> 'compareAt')::int, (l ->> 'quantity')::int,
         (l ->> 'lineSubtotal')::int, (l ->> 'discount')::int, (l ->> 'lineTotal')::int
  from jsonb_array_elements(v_quote -> 'lines') l;

  -- hold stock: online orders expire if unpaid; COD holds until committed below
  v_ttl := case when v_provider = 'cod' then null else make_interval(mins => s.reservation_ttl_minutes) end;
  for v_line in select * from jsonb_array_elements(v_quote -> 'lines') loop
    perform public.reserve_inventory((v_line ->> 'variantId')::uuid, (v_line ->> 'quantity')::int,
                                     v_order.id, v_checkout, v_ttl);
  end loop;

  if (v_quote -> 'coupon' ->> 'id') is not null then
    insert into public.coupon_redemptions (coupon_id, order_id, user_id, email, discount_amount)
    values ((v_quote -> 'coupon' ->> 'id')::uuid, v_order.id, v_user, v_email, (v_quote -> 'coupon' ->> 'discount')::int);
  end if;
  insert into public.offer_redemptions (offer_id, order_id, applications, discount_amount)
  select (d ->> 'id')::uuid, v_order.id, (d ->> 'applications')::int, (d ->> 'amount')::int
  from jsonb_array_elements(v_quote -> 'appliedDiscounts') d where d ->> 'kind' = 'offer';

  if v_order.total > 0 then
    insert into public.payments (order_id, provider, amount, method)
    values (v_order.id, v_provider, v_order.total, case when v_provider = 'cod' then 'cod'::public.payment_method end);
  end if;

  if v_checkout is not null then
    update public.checkout_sessions
       set order_id = v_order.id, quote = v_quote, status = 'payment_pending'
     where id = v_checkout;
  end if;

  if v_provider = 'cod' or v_order.total = 0 then
    perform public.confirm_order_side_effects(v_order.id);
    update public.orders
       set status = case when v_order.total = 0 then 'paid'::public.order_status else 'processing'::public.order_status end,
           payment_status = case when v_order.total = 0 then 'captured'::public.payment_status else payment_status end
     where id = v_order.id
     returning * into v_order;
  end if;

  return public.order_json(v_order) || jsonb_build_object('replayed', false);
end $$;

-- =============================================================================
-- Payments
-- =============================================================================

-- Open a new try. Refuses once the order is paid: the "never pay twice" gate before money moves.
create or replace function public.start_payment_attempt(
  p_order_id uuid,
  p_provider public.payment_provider,
  p_provider_order_id text default null,
  p_method public.payment_method default null,
  p_raw_request jsonb default null,
  p_client_ip inet default null,
  p_user_agent text default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_order   public.orders;
  v_payment public.payments;
  v_attempt public.payment_attempts;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found' using errcode = 'P0002'; end if;
  if v_order.payment_status in ('authorized', 'captured', 'refunded', 'partially_refunded')
     or exists (select 1 from public.payment_attempts a where a.order_id = p_order_id and a.status in ('authorized', 'captured')) then
    raise exception 'order_already_paid' using errcode = 'P0001';
  end if;
  if v_order.status <> 'pending_payment' then
    raise exception 'order_not_payable' using errcode = 'P0001', detail = v_order.status::text;
  end if;
  if not coalesce((select g.is_enabled from public.payment_gateways g where g.provider = p_provider), false) then
    raise exception 'gateway_disabled' using errcode = 'P0001';
  end if;

  insert into public.payments (order_id, provider, amount)
  values (p_order_id, p_provider, v_order.total)
  on conflict (order_id, provider) do update set status = 'initiated'
  returning * into v_payment;

  update public.payments
     set attempt_count = attempt_count + 1,
         provider_order_id = coalesce(p_provider_order_id, provider_order_id),
         method = coalesce(p_method, method)
   where id = v_payment.id returning * into v_payment;

  insert into public.payment_attempts (payment_id, order_id, attempt_no, provider, method, amount, provider_order_id,
                                       raw_request, client_ip, user_agent)
  values (v_payment.id, p_order_id, v_payment.attempt_count, p_provider, p_method, v_order.total, p_provider_order_id,
          p_raw_request, p_client_ip, p_user_agent)
  returning * into v_attempt;

  update public.orders set payment_status = 'initiated' where id = p_order_id and payment_status = 'failed';
  -- give the customer time to finish paying
  update public.inventory_reservations set expires_at = greatest(expires_at, now() + interval '15 minutes')
   where order_id = p_order_id and status = 'active' and expires_at is not null;

  return jsonb_build_object('attemptId', v_attempt.id, 'paymentId', v_payment.id, 'attemptNo', v_attempt.attempt_no,
                            'amount', v_attempt.amount, 'currency', v_payment.currency);
end $$;

-- Record exactly where/why a try failed. Late failures after success are ignored (idempotent).
create or replace function public.record_payment_failure(
  p_attempt_id uuid,
  p_stage public.payment_failure_stage,
  p_code text default null,
  p_reason text default null,
  p_source text default null,
  p_raw jsonb default null,
  p_provider_payment_id text default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_attempt public.payment_attempts;
begin
  select * into v_attempt from public.payment_attempts where id = p_attempt_id for update;
  if not found then raise exception 'attempt_not_found' using errcode = 'P0002'; end if;
  if v_attempt.status in ('authorized', 'captured', 'duplicate') then
    return jsonb_build_object('result', 'ignored_already_succeeded', 'attemptId', p_attempt_id);
  end if;
  if v_attempt.status in ('failed', 'cancelled') then
    return jsonb_build_object('result', 'already_failed', 'attemptId', p_attempt_id);
  end if;

  update public.payment_attempts
     set status = case when p_stage = 'user_cancelled' then 'cancelled'::public.payment_attempt_status
                       else 'failed'::public.payment_attempt_status end,
         failure_stage = p_stage,
         failure_code = p_code,
         failure_reason = p_reason,
         failure_source = coalesce(p_source, case p_stage
                                     when 'user_cancelled' then 'customer' when 'otp_timeout' then 'customer'
                                     when 'bank_declined' then 'bank' when 'insufficient_funds' then 'bank'
                                     when 'order_creation' then 'internal' when 'signature_mismatch' then 'internal'
                                     when 'amount_mismatch' then 'business' else 'gateway' end),
         provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id),
         raw_response = coalesce(p_raw, raw_response),
         completed_at = now()
   where id = p_attempt_id;

  update public.payments
     set status = 'failed', last_failure_stage = p_stage, last_failure_code = p_code,
         last_failure_reason = p_reason, failed_at = now()
   where id = v_attempt.payment_id and status = 'initiated';
  update public.orders set payment_status = 'failed'
   where id = v_attempt.order_id and status = 'pending_payment' and payment_status = 'initiated';

  return jsonb_build_object('result', 'recorded', 'attemptId', p_attempt_id, 'orderId', v_attempt.order_id);
end $$;

-- Idempotent capture. Safe to call from the client callback AND the webhook, any number of times.
-- result: captured | already_captured | duplicate (refundRequired) | amount_mismatch (refundRequired)
--         | captured_on_cancelled_order (refundRequired)
create or replace function public.mark_payment_captured(
  p_order_id uuid,
  p_attempt_id uuid,
  p_provider_payment_id text,
  p_amount integer,
  p_method public.payment_method default null,
  p_raw jsonb default null,
  p_method_details jsonb default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_order   public.orders;
  v_attempt public.payment_attempts;
  v_other   public.payment_attempts;
  v_replay  boolean := false;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found' using errcode = 'P0002'; end if;
  select * into v_attempt from public.payment_attempts where id = p_attempt_id and order_id = p_order_id for update;
  if not found then raise exception 'attempt_not_found' using errcode = 'P0002'; end if;

  if v_attempt.status in ('captured', 'authorized') then
    if v_attempt.provider_payment_id is distinct from p_provider_payment_id then
      raise exception 'attempt_already_captured_with_different_payment' using errcode = 'P0001';
    end if;
    v_replay := true;
  elsif v_attempt.status = 'duplicate' then
    return jsonb_build_object('result', 'duplicate', 'refundRequired', true, 'orderId', p_order_id, 'attemptId', p_attempt_id);
  else
    -- a different attempt already took the money -> this one is a double payment
    select * into v_other from public.payment_attempts
     where order_id = p_order_id and status in ('captured', 'authorized') and id <> p_attempt_id;
    if found then
      update public.payment_attempts
         set status = 'duplicate', provider_payment_id = p_provider_payment_id, amount = p_amount,
             method = coalesce(p_method, method), method_details = coalesce(p_method_details, method_details),
             raw_response = coalesce(p_raw, raw_response), completed_at = now(),
             failure_reason = 'duplicate capture: order already paid by attempt ' || v_other.id || '; refund required'
       where id = p_attempt_id;
      return jsonb_build_object('result', 'duplicate', 'refundRequired', true, 'orderId', p_order_id,
                                'attemptId', p_attempt_id, 'paidByAttemptId', v_other.id);
    end if;

    if p_amount <> v_order.total then
      update public.payment_attempts
         set status = 'failed', failure_stage = 'amount_mismatch', failure_source = 'business',
             failure_reason = format('captured %s but order total is %s', p_amount, v_order.total),
             provider_payment_id = p_provider_payment_id, raw_response = coalesce(p_raw, raw_response), completed_at = now()
       where id = p_attempt_id;
      return jsonb_build_object('result', 'amount_mismatch', 'refundRequired', true, 'orderId', p_order_id);
    end if;

    update public.payment_attempts
       set status = 'captured', provider_payment_id = p_provider_payment_id, method = coalesce(p_method, method),
           method_details = coalesce(p_method_details, method_details), raw_response = coalesce(p_raw, raw_response),
           completed_at = now(), failure_stage = null, failure_code = null, failure_reason = null
     where id = p_attempt_id;
    update public.payments
       set status = 'captured', amount_captured = p_amount, provider_payment_id = p_provider_payment_id,
           method = coalesce(p_method, method), captured_at = now()
     where id = v_attempt.payment_id;
  end if;

  if v_order.status = 'cancelled' then
    update public.orders set payment_status = 'captured' where id = p_order_id and payment_status <> 'captured';
    return jsonb_build_object('result', 'captured_on_cancelled_order', 'refundRequired', true, 'orderId', p_order_id,
                              'orderNumber', v_order.order_number);
  end if;

  -- converge order state (also repairs an order whose earlier capture call died half-way)
  if v_order.status = 'pending_payment' then
    perform public.confirm_order_side_effects(p_order_id);
    update public.orders set status = 'paid', payment_status = 'captured' where id = p_order_id;
  end if;

  return jsonb_build_object('result', case when v_replay then 'already_captured' else 'captured' end,
                            'refundRequired', false, 'orderId', p_order_id, 'orderNumber', v_order.order_number);
end $$;

-- Support / cron: inspect an order's payments and repair state. Never creates money movement.
create or replace function public.reconcile_order_payment(p_order_id uuid)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_order    public.orders;
  v_success  public.payment_attempts;
  v_fix      jsonb := null;
  v_dupes    jsonb;
begin
  select * into v_order from public.orders where id = p_order_id;
  if not found then raise exception 'order_not_found' using errcode = 'P0002'; end if;

  select * into v_success from public.payment_attempts
   where order_id = p_order_id and status in ('captured', 'authorized') limit 1;
  if found and v_order.status = 'pending_payment' then
    v_fix := public.mark_payment_captured(p_order_id, v_success.id, v_success.provider_payment_id, v_success.amount);
    select * into v_order from public.orders where id = p_order_id;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('attemptId', a.id, 'providerPaymentId', a.provider_payment_id,
                                               'amount', a.amount, 'refunded', r.id is not null)), '[]')
    into v_dupes
  from public.payment_attempts a
  left join public.refunds r on r.attempt_id = a.id and r.status <> 'failed'
  where a.order_id = p_order_id and (a.status = 'duplicate' or (a.status = 'failed' and a.failure_stage = 'amount_mismatch'));

  return jsonb_build_object(
    'orderId', p_order_id, 'orderNumber', v_order.order_number,
    'orderStatus', v_order.status, 'paymentStatus', v_order.payment_status,
    'successfulAttemptId', v_success.id,
    'attempts', (select count(*) from public.payment_attempts a where a.order_id = p_order_id),
    'capturedWhileCancelled', v_order.status = 'cancelled' and v_success.id is not null,
    'refundsNeeded', (select coalesce(jsonb_agg(d), '[]') from jsonb_array_elements(v_dupes) d where not (d ->> 'refunded')::boolean),
    'repair', v_fix);
end $$;

-- =============================================================================
-- Cancellation + expiry sweeper
-- =============================================================================
create or replace function public.cancel_order(p_order_id uuid, p_reason text default 'cancelled')
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders;
  v_inv   public.inventory;
  r record;
begin
  if not (public.is_service_role() or public.has_permission('orders.write')) then
    raise exception 'orders.write permission required' using errcode = '42501';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found' using errcode = 'P0002'; end if;
  if not public.order_status_allowed(v_order.status, 'cancelled') or v_order.status = 'cancelled' then
    raise exception 'order_not_cancellable' using errcode = 'P0001', detail = v_order.status::text;
  end if;

  perform public.release_order_inventory(p_order_id,
    case when p_reason = 'payment_timeout' then 'expired'::public.reservation_status else 'released'::public.reservation_status end);
  -- stock already committed (paid / COD) goes back on the shelf
  for r in select res.variant_id, res.quantity from public.inventory_reservations res
            where res.order_id = p_order_id and res.status = 'consumed' order by res.variant_id loop
    update public.inventory set on_hand = on_hand + r.quantity where variant_id = r.variant_id returning * into v_inv;
    insert into public.inventory_movements (variant_id, reason, delta_on_hand, on_hand_after, reserved_after,
                                            reference_type, reference_id, note, actor_id)
    values (r.variant_id, 'cancellation', r.quantity, v_inv.on_hand, v_inv.reserved, 'order', p_order_id,
            'order cancelled: ' || p_reason, auth.uid());
  end loop;
  update public.inventory_reservations set status = 'released', released_at = now()
   where order_id = p_order_id and status = 'consumed';

  update public.coupons c set usage_count = greatest(usage_count - 1, 0)
    from public.coupon_redemptions cr where cr.order_id = p_order_id and cr.coupon_id = c.id and cr.status = 'applied';
  update public.coupon_redemptions set status = 'reversed' where order_id = p_order_id;
  update public.offers x set usage_count = greatest(usage_count - 1, 0)
    from public.offer_redemptions orr where orr.order_id = p_order_id and orr.offer_id = x.id and orr.status = 'applied';
  update public.offer_redemptions set status = 'reversed' where order_id = p_order_id;

  perform set_config('wavy.status_note', p_reason, true);
  update public.orders set status = 'cancelled', cancel_reason = p_reason where id = p_order_id returning * into v_order;
  perform set_config('wavy.status_note', '', true);
  update public.checkout_sessions set status = 'expired' where order_id = p_order_id and status <> 'completed';

  return public.order_json(v_order) || jsonb_build_object('refundRequired', v_order.payment_status = 'captured');
end $$;

-- Cancel unpaid orders whose holds expired; drop orphan checkout holds. Run every 5 min.
create or replace function public.release_expired_reservations()
returns integer
language plpgsql security definer set search_path = '' as $$
declare v_n integer := 0; r record;
begin
  for r in
    select o.id from public.orders o
    where o.status = 'pending_payment'
      and exists (select 1 from public.inventory_reservations x
                   where x.order_id = o.id and x.status = 'active' and x.expires_at <= now())
      and not exists (select 1 from public.payment_attempts a
                       where a.order_id = o.id and a.status in ('authorized', 'captured'))
    for update of o skip locked
  loop
    perform public.cancel_order(r.id, 'payment_timeout');
    v_n := v_n + 1;
  end loop;
  perform public.release_inventory(x.id, 'expired')
  from public.inventory_reservations x
  where x.status = 'active' and x.order_id is null and x.expires_at <= now();
  return v_n;
end $$;

-- =============================================================================
-- Refund bookkeeping
-- =============================================================================
create or replace function public.refunds_before_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_payment public.payments; v_attempt public.payment_attempts; v_used integer;
begin
  select * into v_payment from public.payments where id = new.payment_id for update;
  if v_payment.order_id <> new.order_id then raise exception 'refund_order_mismatch' using errcode = 'P0001'; end if;
  if new.attempt_id is not null then
    select * into v_attempt from public.payment_attempts where id = new.attempt_id;
  end if;
  if v_attempt.id is not null and v_attempt.status in ('duplicate', 'failed') then
    -- refund of a double / mismatched capture: bounded by that attempt's amount
    select coalesce(sum(amount), 0) into v_used from public.refunds where attempt_id = new.attempt_id and status <> 'failed';
    if v_used + new.amount > v_attempt.amount then raise exception 'refund_exceeds_captured' using errcode = 'P0001'; end if;
  else
    select coalesce(sum(r.amount), 0) into v_used from public.refunds r
     left join public.payment_attempts a on a.id = r.attempt_id
     where r.payment_id = new.payment_id and r.status <> 'failed' and (a.id is null or a.status not in ('duplicate', 'failed'));
    if v_used + new.amount > v_payment.amount_captured then
      raise exception 'refund_exceeds_captured' using errcode = 'P0001',
        detail = format('captured %s, already refunded %s, requested %s', v_payment.amount_captured, v_used, new.amount);
    end if;
  end if;
  new.initiated_by := coalesce(new.initiated_by, auth.uid());
  return new;
end $$;
create trigger refunds_before_insert before insert on public.refunds
  for each row execute function public.refunds_before_insert();

create or replace function public.refunds_after_processed()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_payment public.payments; v_is_dupe boolean;
begin
  if tg_op = 'UPDATE' and old.status = 'processed' then return null; end if;   -- count once
  v_is_dupe := exists (select 1 from public.payment_attempts a where a.id = new.attempt_id and a.status in ('duplicate', 'failed'));
  if v_is_dupe then return null; end if;          -- order's own payment untouched
  update public.payments
     set amount_refunded = amount_refunded + new.amount,
         status = case when amount_refunded + new.amount >= amount_captured
                       then 'refunded'::public.payment_status else 'partially_refunded'::public.payment_status end
   where id = new.payment_id returning * into v_payment;
  update public.orders
     set payment_status = v_payment.status,
         status = case when v_payment.status = 'refunded' and public.order_status_allowed(status, 'refunded')
                       then 'refunded'::public.order_status else status end
   where id = new.order_id;
  if new.return_request_id is not null then
    update public.return_requests set status = 'refunded' where id = new.return_request_id and status = 'received';
  end if;
  return null;
end $$;
create trigger refunds_after_processed after insert or update of status on public.refunds
  for each row when (new.status = 'processed') execute function public.refunds_after_processed();

-- =============================================================================
-- Public tracking: safe fields only (no email/phone/street address).
-- =============================================================================
create or replace function public.get_order_tracking(p_token text)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare o public.orders;
begin
  if p_token is null or char_length(p_token) < 32 then return null; end if;
  select * into o from public.orders where tracking_token = p_token;
  if not found then return null; end if;
  return jsonb_build_object(
    'number', o.order_number,
    'status', o.status,
    'paymentStatus', o.payment_status,
    'placedAt', o.placed_at,
    'deliveredAt', o.delivered_at,
    'shipTo', jsonb_build_object('name', split_part(coalesce(o.shipping_address ->> 'name', ''), ' ', 1),
                                 'city', o.shipping_address ->> 'city', 'state', o.shipping_address ->> 'state',
                                 'postalCode', o.shipping_address ->> 'postalCode'),
    'items', (select coalesce(jsonb_agg(jsonb_build_object('name', i.product_name, 'color', i.color, 'size', i.size,
                                                           'quantity', i.quantity, 'image', i.image_url)), '[]')
                from public.order_items i where i.order_id = o.id),
    'shipment', (select jsonb_build_object(
                   'carrier', sh.courier_name, 'awb', sh.awb, 'status', sh.status, 'eta', sh.eta,
                   'trackingUrl', sh.tracking_url,
                   'events', (select coalesce(jsonb_agg(jsonb_build_object('at', e.occurred_at, 'status', e.status,
                                                                           'location', e.location, 'note', e.note)
                                                        order by e.occurred_at desc), '[]')
                                from public.shipment_events e where e.shipment_id = sh.id))
                 from public.shipments sh where sh.order_id = o.id and sh.direction = 'forward'
                 order by sh.created_at desc limit 1),
    'history', (select coalesce(jsonb_agg(jsonb_build_object('status', h.to_status, 'at', h.created_at) order by h.created_at), '[]')
                  from public.order_status_history h where h.order_id = o.id));
end $$;

-- =============================================================================
-- Support: one customer's full journey (events, orders, payment tries, tickets, try-ons).
-- =============================================================================
create or replace function public.get_customer_journey(p_user_id uuid, p_limit integer default 200)
returns table (occurred_at timestamptz, kind text, summary text, ref_id text, detail jsonb)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not (public.is_service_role() or public.has_permission('journey.read')) then
    raise exception 'journey.read permission required' using errcode = '42501';
  end if;
  return query
  select j.* from (
    select e.created_at, 'event'::text, e.event_name::text, coalesce(e.order_id, e.product_id)::text,
           jsonb_build_object('path', e.path, 'sessionId', e.visitor_session_id, 'properties', e.properties)
      from public.analytics_events e
     where e.user_id = p_user_id
        or e.visitor_session_id in (select vs.id from public.visitor_sessions vs where vs.user_id = p_user_id)
    union all
    select o.placed_at, 'order'::text, o.order_number || ' ' || o.status::text, o.id::text,
           jsonb_build_object('total', o.total, 'paymentStatus', o.payment_status, 'provider', o.payment_provider)
      from public.orders o where o.user_id = p_user_id
    union all
    select a.started_at, 'payment_attempt'::text,
           a.provider::text || ' #' || a.attempt_no || ' ' || a.status::text || coalesce(' at ' || a.failure_stage::text, ''),
           a.order_id::text,
           jsonb_build_object('attemptId', a.id, 'method', a.method, 'amount', a.amount, 'failureCode', a.failure_code,
                              'failureReason', a.failure_reason, 'providerPaymentId', a.provider_payment_id)
      from public.payment_attempts a join public.orders o on o.id = a.order_id where o.user_id = p_user_id
    union all
    select t.created_at, 'support_ticket'::text, t.ticket_number || ' ' || t.subject, t.id::text,
           jsonb_build_object('status', t.status, 'category', t.category)
      from public.support_tickets t where t.user_id = p_user_id
    union all
    select ts.created_at, 'try_on'::text, ts.status::text, ts.id::text,
           jsonb_build_object('productId', ts.product_id, 'errorClass', ts.error_class, 'latencyMs', ts.latency_ms)
      from public.tryon_sessions ts where ts.user_id = p_user_id
  ) as j(occurred_at, kind, summary, ref_id, detail)
  order by j.occurred_at desc
  limit p_limit;
end $$;

-- =============================================================================
-- Optional scheduling (Supabase pg_cron). Skipped silently where pg_cron is absent.
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('wavy-release-expired-reservations', '*/5 * * * *', 'select public.release_expired_reservations()');
    perform cron.schedule('wavy-publish-scheduled-posts', '*/10 * * * *', 'select public.publish_scheduled_posts()');
    perform cron.schedule('wavy-analytics-partitions', '0 3 20 * *',
                          $c$select public.ensure_analytics_partition((now() + interval '1 month')::date)$c$);
  end if;
end $$;
