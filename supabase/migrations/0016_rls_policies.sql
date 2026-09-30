-- =============================================================================
-- 0016 — Row Level Security on EVERY table + grants
-- Model:
--   anon/authenticated  public read of published catalog/content only
--   customers           their own rows (user_id = auth.uid())
--   staff               has_permission('<perm>') — see 0002 + src/backend/_core/permissions.ts
--   service_role        bypasses RLS (backend: checkout, webhooks, cron, ingestion)
-- has_permission()/auth.uid() are wrapped in (select ...) so they run once per statement.
-- =============================================================================

-- ---------- enable RLS everywhere (incl. partitions) ----------
do $$
declare r record;
begin
  for r in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public' and c.relkind in ('r', 'p') loop
    execute format('alter table public.%I enable row level security', r.relname);
  end loop;
end $$;

-- ---------- policy helpers (session-local, gone after this migration) ----------
create function pg_temp.staff_read(p_table text, p_perm text) returns void language plpgsql as $f$
begin
  execute format('create policy %I on public.%I for select to authenticated using ((select public.has_permission(%L)))',
                 'staff_read_' || replace(p_perm, '.', '_'), p_table, p_perm);
end $f$;
create function pg_temp.staff_write(p_table text, p_perm text) returns void language plpgsql as $f$
begin
  execute format('create policy %I on public.%I for all to authenticated using ((select public.has_permission(%L))) with check ((select public.has_permission(%L)))',
                 'staff_write_' || replace(p_perm, '.', '_'), p_table, p_perm, p_perm);
end $f$;
create function pg_temp.public_read(p_table text, p_using text) returns void language plpgsql as $f$
begin
  execute format('create policy public_read on public.%I for select to anon, authenticated using (%s)', p_table, p_using);
end $f$;

-- =============================================================================
-- Identity
-- =============================================================================
create policy own_select on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy own_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
select pg_temp.staff_read('profiles', 'customers.read');
create policy staff_update_customers_write on public.profiles for update to authenticated
  using ((select public.has_permission('customers.write'))) with check ((select public.has_permission('customers.write')));
select pg_temp.staff_read('profiles', 'staff.manage');

create policy authenticated_read on public.permissions for select to authenticated using (true);
create policy authenticated_read on public.role_permissions for select to authenticated using (true);
-- role_permissions writes: migrations only (keeps DB == permissions.ts)

create policy own_select on public.staff_members for select to authenticated using (user_id = (select auth.uid()));
select pg_temp.staff_write('staff_members', 'staff.manage');

-- =============================================================================
-- Catalog
-- =============================================================================
select pg_temp.public_read('categories', 'is_active');
select pg_temp.staff_read('categories', 'catalog.read');
select pg_temp.staff_write('categories', 'catalog.write');

select pg_temp.public_read('collections', 'is_active');
select pg_temp.staff_read('collections', 'catalog.read');
select pg_temp.staff_write('collections', 'catalog.write');

select pg_temp.public_read('products', $$status = 'published'$$);
select pg_temp.staff_read('products', 'catalog.read');
select pg_temp.staff_write('products', 'catalog.write');

select pg_temp.public_read('collection_products',
  $$exists (select 1 from public.products p where p.id = product_id and p.status = 'published')$$);
select pg_temp.staff_read('collection_products', 'catalog.read');
select pg_temp.staff_write('collection_products', 'catalog.write');

select pg_temp.public_read('product_variants',
  $$status <> 'disabled' and exists (select 1 from public.products p where p.id = product_id and p.status = 'published')$$);
select pg_temp.staff_read('product_variants', 'catalog.read');
select pg_temp.staff_write('product_variants', 'catalog.write');

select pg_temp.public_read('product_media',
  $$exists (select 1 from public.products p where p.id = product_id and p.status = 'published')$$);
select pg_temp.staff_read('product_media', 'catalog.read');
select pg_temp.staff_write('product_media', 'catalog.write');

select pg_temp.public_read('inventory',
  $$exists (select 1 from public.product_variants v join public.products p on p.id = v.product_id
            where v.id = variant_id and p.status = 'published')$$);
select pg_temp.staff_read('inventory', 'inventory.read');
select pg_temp.staff_write('inventory', 'inventory.write');
select pg_temp.staff_read('inventory_reservations', 'inventory.read');
select pg_temp.staff_read('inventory_movements', 'inventory.read');

select pg_temp.public_read('attributes', 'true');
select pg_temp.staff_write('attributes', 'catalog.write');
select pg_temp.public_read('attribute_values', 'true');
select pg_temp.staff_write('attribute_values', 'catalog.write');
select pg_temp.public_read('product_attribute_values',
  $$exists (select 1 from public.products p where p.id = product_id and p.status = 'published')$$);
select pg_temp.staff_read('product_attribute_values', 'catalog.read');
select pg_temp.staff_write('product_attribute_values', 'catalog.write');
select pg_temp.public_read('related_products',
  $$exists (select 1 from public.products p where p.id = related_product_id and p.status = 'published')$$);
select pg_temp.staff_read('related_products', 'catalog.read');
select pg_temp.staff_write('related_products', 'catalog.write');

create policy own_all on public.wishlist_items for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
select pg_temp.staff_read('wishlist_items', 'customers.read');

-- =============================================================================
-- Cart / checkout / shipping config
-- =============================================================================
create policy own_all on public.addresses for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
select pg_temp.staff_read('addresses', 'customers.read');

select pg_temp.public_read('shipping_zones', 'is_active');
select pg_temp.staff_read('shipping_zones', 'settings.read');
select pg_temp.staff_write('shipping_zones', 'settings.shipping.manage');
select pg_temp.public_read('shipping_methods', 'is_active');
select pg_temp.staff_read('shipping_methods', 'settings.read');
select pg_temp.staff_write('shipping_methods', 'settings.shipping.manage');

create policy own_select on public.carts for select to authenticated using (user_id = (select auth.uid()));
create policy own_insert on public.carts for insert to authenticated with check (user_id = (select auth.uid()));
create policy own_update on public.carts for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
select pg_temp.staff_read('carts', 'customers.read');

create policy own_all on public.cart_items for all to authenticated
  using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())))
  with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid()) and c.status = 'active'));
select pg_temp.staff_read('cart_items', 'customers.read');

create policy own_select on public.checkout_sessions for select to authenticated using (user_id = (select auth.uid()));
select pg_temp.staff_read('checkout_sessions', 'orders.read');

-- =============================================================================
-- Orders + payments (writes happen in SECURITY DEFINER RPCs / service role)
-- =============================================================================
create policy own_select on public.orders for select to authenticated using (user_id = (select auth.uid()));
select pg_temp.staff_read('orders', 'orders.read');
create policy staff_update_orders_write on public.orders for update to authenticated
  using ((select public.has_permission('orders.write'))) with check ((select public.has_permission('orders.write')));

create policy own_select on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));
select pg_temp.staff_read('order_items', 'orders.read');

create policy own_select on public.order_status_history for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));
select pg_temp.staff_read('order_status_history', 'orders.read');

select pg_temp.public_read('payment_gateways', 'is_enabled');
select pg_temp.staff_read('payment_gateways', 'payments.read');
select pg_temp.staff_write('payment_gateways', 'payments.gateway.manage');

create policy own_select on public.payments for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));
select pg_temp.staff_read('payments', 'payments.read');
select pg_temp.staff_read('payment_attempts', 'payments.read');
select pg_temp.staff_read('payment_events', 'payments.read');

create policy own_select on public.refunds for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));
select pg_temp.staff_read('refunds', 'payments.read');
select pg_temp.staff_write('refunds', 'orders.refund');

-- =============================================================================
-- Shipping + returns
-- =============================================================================
create policy own_select on public.shipments for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));
select pg_temp.staff_read('shipments', 'orders.read');
select pg_temp.staff_write('shipments', 'shipments.write');

create policy own_select on public.shipment_items for select to authenticated
  using (exists (select 1 from public.shipments s join public.orders o on o.id = s.order_id
                 where s.id = shipment_id and o.user_id = (select auth.uid())));
select pg_temp.staff_read('shipment_items', 'orders.read');
select pg_temp.staff_write('shipment_items', 'shipments.write');

create policy own_select on public.shipment_events for select to authenticated
  using (exists (select 1 from public.shipments s join public.orders o on o.id = s.order_id
                 where s.id = shipment_id and o.user_id = (select auth.uid())));
select pg_temp.staff_read('shipment_events', 'orders.read');
select pg_temp.staff_write('shipment_events', 'shipments.write');

create policy own_select on public.return_requests for select to authenticated using (user_id = (select auth.uid()));
create policy own_insert on public.return_requests for insert to authenticated with check (user_id = (select auth.uid()));
select pg_temp.staff_read('return_requests', 'returns.read');
select pg_temp.staff_write('return_requests', 'returns.write');

create policy own_select on public.return_items for select to authenticated
  using (exists (select 1 from public.return_requests r where r.id = return_request_id and r.user_id = (select auth.uid())));
create policy own_insert on public.return_items for insert to authenticated
  with check (exists (select 1 from public.return_requests r where r.id = return_request_id
                      and r.user_id = (select auth.uid()) and r.status = 'requested'));
select pg_temp.staff_read('return_items', 'returns.read');
select pg_temp.staff_write('return_items', 'returns.write');

create policy own_select on public.return_evidence for select to authenticated
  using (exists (select 1 from public.return_requests r where r.id = return_request_id and r.user_id = (select auth.uid())));
create policy own_insert on public.return_evidence for insert to authenticated
  with check (exists (select 1 from public.return_requests r where r.id = return_request_id
                      and r.user_id = (select auth.uid()) and r.status = 'requested'));
select pg_temp.staff_read('return_evidence', 'returns.read');
select pg_temp.staff_write('return_evidence', 'returns.write');

-- =============================================================================
-- Reviews
-- =============================================================================
select pg_temp.public_read('reviews', $$status = 'approved'$$);
create policy own_select on public.reviews for select to authenticated using (user_id = (select auth.uid()));
create policy own_insert on public.reviews for insert to authenticated with check (user_id = (select auth.uid()));
create policy own_update on public.reviews for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy own_delete on public.reviews for delete to authenticated using (user_id = (select auth.uid()));
select pg_temp.staff_write('reviews', 'reviews.moderate');

select pg_temp.public_read('review_media',
  $$exists (select 1 from public.reviews r where r.id = review_id and r.status = 'approved')$$);
create policy own_all on public.review_media for all to authenticated
  using (exists (select 1 from public.reviews r where r.id = review_id and r.user_id = (select auth.uid())))
  with check (exists (select 1 from public.reviews r where r.id = review_id and r.user_id = (select auth.uid())));
select pg_temp.staff_write('review_media', 'reviews.moderate');

create policy own_all on public.review_votes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- =============================================================================
-- Marketing
-- =============================================================================
select pg_temp.staff_read('coupons', 'marketing.read');
select pg_temp.staff_write('coupons', 'coupons.write');

select pg_temp.public_read('offers', $$status = 'active'$$);
select pg_temp.staff_read('offers', 'marketing.read');
select pg_temp.staff_write('offers', 'offers.write');

select pg_temp.public_read('discount_targets',
  $$offer_id is not null and exists (select 1 from public.offers o where o.id = offer_id and o.status = 'active')$$);
select pg_temp.staff_read('discount_targets', 'marketing.read');
create policy staff_write_targets on public.discount_targets for all to authenticated
  using ((coupon_id is not null and (select public.has_permission('coupons.write')))
      or (offer_id is not null and (select public.has_permission('offers.write'))))
  with check ((coupon_id is not null and (select public.has_permission('coupons.write')))
      or (offer_id is not null and (select public.has_permission('offers.write'))));

create policy own_select on public.coupon_redemptions for select to authenticated using (user_id = (select auth.uid()));
select pg_temp.staff_read('coupon_redemptions', 'marketing.read');
select pg_temp.staff_read('coupon_redemptions', 'orders.read');
select pg_temp.staff_read('offer_redemptions', 'marketing.read');
select pg_temp.staff_read('offer_redemptions', 'orders.read');

select pg_temp.public_read('campaigns', $$status = 'live'$$);
select pg_temp.staff_read('campaigns', 'marketing.read');
select pg_temp.staff_write('campaigns', 'campaigns.write');
select pg_temp.public_read('campaign_products',
  $$exists (select 1 from public.campaigns c where c.id = campaign_id and c.status = 'live')$$);
select pg_temp.staff_read('campaign_products', 'marketing.read');
select pg_temp.staff_write('campaign_products', 'campaigns.write');
select pg_temp.public_read('campaign_collections',
  $$exists (select 1 from public.campaigns c where c.id = campaign_id and c.status = 'live')$$);
select pg_temp.staff_read('campaign_collections', 'marketing.read');
select pg_temp.staff_write('campaign_collections', 'campaigns.write');

select pg_temp.public_read('testimonials', 'is_published');
select pg_temp.staff_read('testimonials', 'marketing.read');
select pg_temp.staff_write('testimonials', 'testimonials.write');

-- =============================================================================
-- Content / SEO / blog
-- =============================================================================
select pg_temp.public_read('content_pages', $$status = 'published'$$);
select pg_temp.staff_write('content_pages', 'content.write');
select pg_temp.public_read('faqs', 'is_published');
select pg_temp.staff_write('faqs', 'content.write');
select pg_temp.public_read('lookbook_entries', 'is_published');
select pg_temp.staff_write('lookbook_entries', 'content.write');
select pg_temp.public_read('lookbook_entry_products',
  $$exists (select 1 from public.lookbook_entries e where e.id = entry_id and e.is_published)$$);
select pg_temp.staff_write('lookbook_entry_products', 'content.write');

select pg_temp.public_read('blog_categories', 'true');
select pg_temp.staff_write('blog_categories', 'blog.write');
select pg_temp.public_read('blog_tags', 'true');
select pg_temp.staff_write('blog_tags', 'blog.write');
select pg_temp.public_read('blog_posts', $$status = 'published' and published_at <= now()$$);
select pg_temp.staff_write('blog_posts', 'blog.write');
select pg_temp.staff_write('blog_posts', 'blog.publish');
select pg_temp.public_read('blog_post_tags',
  $$exists (select 1 from public.blog_posts p where p.id = post_id and p.status = 'published')$$);
select pg_temp.staff_write('blog_post_tags', 'blog.write');

select pg_temp.public_read('seo_overrides', 'true');
select pg_temp.staff_write('seo_overrides', 'seo.write');
select pg_temp.public_read('redirects', 'is_active');
select pg_temp.staff_write('redirects', 'seo.write');

-- =============================================================================
-- Analytics / support
-- =============================================================================
select pg_temp.staff_read('visitor_sessions', 'analytics.read');
select pg_temp.staff_read('visitor_sessions', 'journey.read');
select pg_temp.staff_read('analytics_events', 'analytics.read');
select pg_temp.staff_read('analytics_events', 'journey.read');

create policy own_select on public.support_tickets for select to authenticated using (user_id = (select auth.uid()));
create policy own_insert on public.support_tickets for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'open' and assigned_to is null);
select pg_temp.staff_read('support_tickets', 'support.read');
select pg_temp.staff_write('support_tickets', 'support.write');

create policy own_select on public.support_ticket_messages for select to authenticated
  using (not is_internal and exists (select 1 from public.support_tickets t
                                     where t.id = ticket_id and t.user_id = (select auth.uid())));
create policy own_insert on public.support_ticket_messages for insert to authenticated
  with check (author_type = 'customer' and not is_internal and author_id = (select auth.uid())
              and exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = (select auth.uid())));
select pg_temp.staff_read('support_ticket_messages', 'support.read');
select pg_temp.staff_write('support_ticket_messages', 'support.write');

-- =============================================================================
-- Settings / integrations / notifications / try-on / audit
-- =============================================================================
select pg_temp.public_read('store_settings', 'true');     -- non-secret: tax rate, thresholds, COD rules
create policy staff_update on public.store_settings for update to authenticated
  using ((select public.has_permission('settings.write') or public.has_permission('settings.tax.manage')
                 or public.has_permission('settings.shipping.manage')))
  with check (true);                                       -- column-level rules: store_settings_guard trigger

select pg_temp.staff_read('integration_configs', 'settings.read');
select pg_temp.staff_write('integration_configs', 'integrations.manage');

select pg_temp.staff_read('notification_log', 'support.read');
select pg_temp.staff_read('notification_log', 'orders.read');

create policy own_select on public.tryon_sessions for select to authenticated using (user_id = (select auth.uid()));
select pg_temp.staff_read('tryon_sessions', 'tryon.read');

select pg_temp.staff_read('audit_logs', 'audit.read');

-- =============================================================================
-- Grants (defence in depth on top of RLS)
-- =============================================================================
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
revoke insert, update, delete on all tables in schema public from anon;
revoke all on public.payment_attempts, public.payment_events, public.audit_logs, public.integration_configs,
              public.notification_log, public.staff_members, public.inventory_movements,
              public.inventory_reservations, public.visitor_sessions, public.analytics_events
  from anon;
revoke insert, update, delete on public.audit_logs, public.payment_attempts, public.payment_events,
                                 public.inventory_movements, public.inventory_reservations, public.order_status_history,
                                 public.coupon_redemptions, public.offer_redemptions, public.analytics_events,
                                 public.visitor_sessions, public.role_permissions, public.permissions
  from authenticated;
-- inventory rows change only through reserve/adjust RPCs
revoke insert, update, delete on public.inventory from authenticated;
-- profiles: role is never client-writable; status/email guarded by trigger
revoke insert, update, delete on public.profiles from authenticated;
grant update (full_name, phone, avatar_url, marketing_opt_in, last_seen_at, status) on public.profiles to authenticated;

-- Functions: private by default, then grant what clients may call.
revoke execute on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
grant execute on all functions in schema public to service_role;

grant execute on function
  public.has_permission(text), public.auth_role(), public.is_staff(), public.is_service_role(),
  public.order_status_allowed(public.order_status, public.order_status), public.category_path(uuid),
  public.get_order_tracking(text)
  to anon, authenticated;
grant execute on function
  public.quote_cart(uuid, uuid, public.payment_provider, text), public.apply_coupon(uuid, text),
  public.get_customer_journey(uuid, integer), public.cancel_order(uuid, text),
  public.adjust_inventory(uuid, integer, public.inventory_reason, text, text, uuid)
  to authenticated;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
