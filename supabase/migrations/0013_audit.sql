-- =============================================================================
-- 0013 — Audit log (append-only) + triggers on high-impact tables
-- Captures actor (auth.uid + role), before/after row images, changed fields, IP / UA
-- from PostgREST request headers. Backend code may add domain actions directly
-- (e.g. action = 'order.refund') via service role.
-- =============================================================================

create table public.audit_logs (
  id             bigint generated always as identity primary key,
  actor_id       uuid,                          -- no FK: keep history even if the user is deleted
  actor_role     text,
  actor_email    text,
  action         text not null,                 -- insert | update | delete | <domain>.<verb>
  entity_type    text not null,                 -- table name or domain entity
  entity_id      text,
  before         jsonb,
  after          jsonb,
  changed_fields text[],
  ip             inet,
  user_agent     text,
  request_id     text,
  created_at     timestamptz not null default now()
);
create index audit_logs_entity_idx  on public.audit_logs (entity_type, entity_id, created_at desc);
create index audit_logs_actor_idx   on public.audit_logs (actor_id, created_at desc) where actor_id is not null;
create index audit_logs_action_idx  on public.audit_logs (action, created_at desc);
create index audit_logs_created_brin on public.audit_logs using brin (created_at);

-- Append-only: block UPDATE/DELETE for everyone, including service role.
create or replace function public.audit_logs_immutable()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'audit_logs is append-only' using errcode = '42501';
end $$;
create trigger audit_logs_no_update before update or delete on public.audit_logs
  for each row execute function public.audit_logs_immutable();

create or replace function public.audit_row_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_before  jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_after   jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_changed text[];
  v_headers jsonb;
  v_ip      text;
begin
  if tg_op = 'UPDATE' then
    select array_agg(k order by k) into v_changed
    from jsonb_object_keys(v_after) k
    where k <> 'updated_at' and (v_before -> k) is distinct from (v_after -> k);
    if v_changed is null then return new; end if;     -- nothing meaningful changed
  end if;

  begin
    v_headers := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then v_headers := null;
  end;
  v_ip := split_part(coalesce(v_headers ->> 'x-forwarded-for', v_headers ->> 'x-real-ip', ''), ',', 1);

  insert into public.audit_logs (actor_id, actor_role, actor_email, action, entity_type, entity_id,
                                 before, after, changed_fields, ip, user_agent, request_id)
  values (
    auth.uid(),
    coalesce(auth.jwt() ->> 'user_role', auth.jwt() ->> 'role', 'system'),
    auth.jwt() ->> 'email',
    lower(tg_op),
    tg_table_name,
    coalesce(v_after ->> 'id', v_before ->> 'id', v_after ->> 'variant_id', v_before ->> 'variant_id',
             v_after ->> 'role', v_before ->> 'role'),
    v_before,
    v_after,
    v_changed,
    case when v_ip ~ '^[0-9a-fA-F:.]+$' then v_ip::inet end,
    v_headers ->> 'user-agent',
    v_headers ->> 'x-request-id'
  );
  return coalesce(new, old);
end $$;

-- Attach to high-impact tables.
create trigger audit_payment_gateways   after insert or update or delete on public.payment_gateways   for each row execute function public.audit_row_change();
create trigger audit_store_settings     after insert or update or delete on public.store_settings     for each row execute function public.audit_row_change();
create trigger audit_integration_configs after insert or update or delete on public.integration_configs for each row execute function public.audit_row_change();
create trigger audit_coupons            after insert or update or delete on public.coupons            for each row execute function public.audit_row_change();
create trigger audit_offers             after insert or update or delete on public.offers             for each row execute function public.audit_row_change();
create trigger audit_refunds            after insert or update or delete on public.refunds            for each row execute function public.audit_row_change();
create trigger audit_staff_members      after insert or update or delete on public.staff_members      for each row execute function public.audit_row_change();
create trigger audit_role_permissions   after insert or update or delete on public.role_permissions   for each row execute function public.audit_row_change();
create trigger audit_shipping_methods   after insert or update or delete on public.shipping_methods   for each row execute function public.audit_row_change();
create trigger audit_products_status    after update of status on public.products
  for each row when (old.status is distinct from new.status) execute function public.audit_row_change();
create trigger audit_variant_prices     after update of price, compare_at on public.product_variants
  for each row when (old.price is distinct from new.price or old.compare_at is distinct from new.compare_at)
  execute function public.audit_row_change();
create trigger audit_profile_role       after update of role, status on public.profiles
  for each row when (old.role is distinct from new.role or old.status is distinct from new.status)
  execute function public.audit_row_change();
create trigger audit_orders_status      after update of status, payment_status on public.orders
  for each row when (old.status is distinct from new.status or old.payment_status is distinct from new.payment_status)
  execute function public.audit_row_change();
