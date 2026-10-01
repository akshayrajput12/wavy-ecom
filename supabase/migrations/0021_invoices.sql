-- =============================================================================
-- 0021 — GST tax invoices
--   store_settings.legal_name / registered_address   seller identity printed on invoices (with gst_number)
--   invoice_counters   one row per series + financial year ('WVY/2026-27/'); the gap-free counter
--   invoices           one per order, frozen snapshot (seller, buyer, lines, CGST/SGST/IGST, totals, words)
--   issue_invoice()    idempotent, concurrency-safe issuance (service role only)
--   storage 'invoices' private bucket for the rendered PDF (service role only, no client policies)
--
-- When an invoice is issued (invoice_eligible):
--   prepaid (razorpay/payu, zero-total) -> once the payment is captured (status paid onward)
--   COD                                -> at dispatch (packed / shipped onward), GST s.31: invoice at removal of goods
--   cancelled-before-issue or unpaid    -> never
-- Out of scope: credit notes (returns/refunds/RTO after issue) and re-issue. An issued invoice never changes.
-- Gap-free: the counter row is bumped in the same transaction as the insert, so a rolled-back issue
-- also rolls back its number. The order row lock makes concurrent/retried calls for one order converge.
-- =============================================================================

alter table public.store_settings
  add column if not exists legal_name         text check (legal_name is null or char_length(legal_name) between 1 and 200),
  add column if not exists registered_address text check (registered_address is null or char_length(registered_address) <= 500);

-- Seller identity on tax invoices sits with the GST fields (settings.tax.manage).
create or replace function public.store_settings_guard()
returns trigger language plpgsql set search_path = '' as $$
declare
  c_tax  text[] := array['tax_percentage', 'tax_inclusive', 'gst_number', 'legal_name', 'registered_address'];
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

create table public.invoice_counters (
  prefix     text primary key check (prefix ~ '^[A-Z]{2,6}/[0-9]{4}-[0-9]{2}/$'),
  last_seq   integer not null default 0 check (last_seq >= 0),
  updated_at timestamptz not null default now()
);

create table public.invoices (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null unique references public.orders (id) on delete restrict,
  invoice_number   text not null unique,
  prefix           text not null references public.invoice_counters (prefix),
  seq              integer not null check (seq > 0),
  issued_at        timestamptz not null default now(),
  snapshot         jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  total            integer not null check (total >= 0),
  tax_total        integer not null check (tax_total >= 0),
  pdf_path         text,                    -- invoices bucket object; null until first render
  pdf_generated_at timestamptz,
  created_at       timestamptz not null default now(),
  unique (prefix, seq)
);
comment on table public.invoices is 'GST tax invoices. Immutable except the cached PDF pointer. Never deleted (legal record).';
create index invoices_issued_at_idx on public.invoices (issued_at desc);   -- admin "download for date range"

-- Number, order, snapshot and money are frozen; only pdf_path/pdf_generated_at may change. No deletes.
create or replace function public.invoices_immutable()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then raise exception 'invoices_are_permanent' using errcode = '42501'; end if;
  if (new.order_id, new.invoice_number, new.prefix, new.seq, new.issued_at, new.snapshot, new.total, new.tax_total)
     is distinct from (old.order_id, old.invoice_number, old.prefix, old.seq, old.issued_at, old.snapshot, old.total, old.tax_total) then
    raise exception 'invoice_immutable' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger invoices_immutable before update or delete on public.invoices
  for each row execute function public.invoices_immutable();

create or replace function public.invoice_eligible(o public.orders)
returns boolean language sql immutable set search_path = '' as $$
  select o.status not in ('pending_payment', 'cancelled') and (
    case when o.payment_provider = 'cod' and o.total > 0
      then o.status in ('packed', 'shipped', 'delivered', 'return_requested', 'returned', 'refunded')
      else o.payment_status in ('captured', 'partially_refunded', 'refunded')
    end);
$$;

-- p_prefix comes from the app (financialYear() in src/backend/invoices/gst.ts, IST April rollover).
-- p_snapshot is built from this order by src/backend/invoices/build.ts and must reconcile to the order's money.
create or replace function public.issue_invoice(p_order_id uuid, p_prefix text, p_snapshot jsonb)
returns public.invoices
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders;
  v_inv   public.invoices;
  v_seq   integer;
begin
  select * into v_order from public.orders where id = p_order_id for update;   -- serialises retries per order
  if not found then raise exception 'order_not_found' using errcode = 'P0002'; end if;
  select * into v_inv from public.invoices where order_id = p_order_id;
  if found then return v_inv; end if;                                            -- idempotent

  if not public.invoice_eligible(v_order) then raise exception 'invoice_not_ready' using errcode = 'P0001'; end if;
  if p_prefix is null or p_prefix !~ '^[A-Z]{2,6}/[0-9]{4}-[0-9]{2}/$' then
    raise exception 'invalid_invoice_prefix' using errcode = '22023';
  end if;
  if jsonb_typeof(p_snapshot) <> 'object'
     or (p_snapshot -> 'totals' ->> 'total')::int is distinct from v_order.total
     or (p_snapshot -> 'totals' ->> 'tax')::int is distinct from v_order.tax_total then
    raise exception 'invoice_totals_mismatch' using errcode = '22023';
  end if;

  insert into public.invoice_counters as c (prefix, last_seq) values (p_prefix, 1)
  on conflict (prefix) do update set last_seq = c.last_seq + 1, updated_at = now()
  returning c.last_seq into v_seq;

  insert into public.invoices (order_id, invoice_number, prefix, seq, snapshot, total, tax_total)
  values (p_order_id, p_prefix || lpad(v_seq::text, greatest(6, length(v_seq::text)), '0'), p_prefix, v_seq,
          p_snapshot, v_order.total, v_order.tax_total)
  returning * into v_inv;
  return v_inv;
end $$;

-- ---------- RLS: owner reads own, staff with orders.read read all, nobody writes from a client ----------
alter table public.invoices enable row level security;
alter table public.invoice_counters enable row level security;
create policy own_select on public.invoices for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));
create policy staff_read_orders_read on public.invoices for select to authenticated
  using ((select public.has_permission('orders.read')));

revoke all on public.invoice_counters from anon, authenticated;
revoke all on public.invoices from anon;
revoke insert, update, delete, truncate, references, trigger on public.invoices from authenticated;

revoke execute on function public.issue_invoice(uuid, text, jsonb), public.invoice_eligible(public.orders),
  public.invoices_immutable() from public, anon, authenticated;
grant execute on function public.issue_invoice(uuid, text, jsonb), public.invoice_eligible(public.orders) to service_role;

-- PDFs: private, server (service role) only. No storage.objects policies on purpose.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('invoices', 'invoices', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;
