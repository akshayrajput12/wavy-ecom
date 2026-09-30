-- =============================================================================
-- 0010 — Customer journey tracking + support tickets
--   visitor_sessions   one row per browser session (anonymous id, utm, device, landing)
--   analytics_events   high-volume, RANGE-partitioned by month on created_at
--   support_tickets / support_ticket_messages  linked to orders & payments
-- Ingestion goes through the backend (service role) — no anon INSERT policy.
-- =============================================================================

create table public.visitor_sessions (
  id            uuid primary key,              -- generated client-side, stored in a cookie
  anonymous_id  text not null check (char_length(anonymous_id) between 8 and 128),   -- long-lived device id
  user_id       uuid references public.profiles (id) on delete set null,             -- set once they sign in
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  utm_term      text,
  utm_content   text,
  referrer      text,
  landing_path  text,
  device_type   text check (device_type in ('mobile', 'tablet', 'desktop', 'bot', 'unknown')),
  os            text,
  browser       text,
  country       char(2),
  region        text,
  city          text,
  ip_hash       text,                          -- sha256(ip + salt); raw IPs are not stored
  user_agent    text,
  page_views    integer not null default 0,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);
create index visitor_sessions_user_idx      on public.visitor_sessions (user_id, last_seen_at desc) where user_id is not null;
create index visitor_sessions_anon_idx      on public.visitor_sessions (anonymous_id, last_seen_at desc);
create index visitor_sessions_campaign_idx  on public.visitor_sessions (utm_campaign, first_seen_at) where utm_campaign is not null;
create index visitor_sessions_first_seen_brin on public.visitor_sessions using brin (first_seen_at);

create table public.analytics_events (
  id                 uuid not null default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  event_name         public.analytics_event_name not null,
  visitor_session_id uuid,                     -- no FK: keeps inserts cheap on a hot table
  anonymous_id       text,
  user_id            uuid,
  path               text,
  page_type          text,
  referrer           text,
  -- hot keys pulled out of properties so they can be indexed
  product_id         uuid,
  variant_id         uuid,
  order_id           uuid,
  properties         jsonb not null default '{}' check (jsonb_typeof(properties) = 'object'),
  source             text not null default 'web' check (source in ('web', 'server')),
  primary key (id, created_at)
) partition by range (created_at);
comment on table public.analytics_events is 'Monthly partitions analytics_events_YYYY_MM; see ensure_analytics_partition().';

-- Partitioned indexes (propagate to every partition).
create index analytics_events_created_brin on public.analytics_events using brin (created_at);
create index analytics_events_name_idx     on public.analytics_events (event_name, created_at desc);
create index analytics_events_user_idx     on public.analytics_events (user_id, created_at desc) where user_id is not null;
create index analytics_events_session_idx  on public.analytics_events (visitor_session_id, created_at);
create index analytics_events_anon_idx     on public.analytics_events (anonymous_id, created_at desc) where anonymous_id is not null;
create index analytics_events_product_idx  on public.analytics_events (product_id, event_name, created_at) where product_id is not null;
create index analytics_events_order_idx    on public.analytics_events (order_id) where order_id is not null;

-- Creates the month partition containing p_month (idempotent). Partitions get RLS + no client grants.
create or replace function public.ensure_analytics_partition(p_month date)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_start date := date_trunc('month', p_month)::date;
  v_end   date := (date_trunc('month', p_month) + interval '1 month')::date;
  v_name  text := 'analytics_events_' || to_char(v_start, 'YYYY_MM');
begin
  if to_regclass('public.' || v_name) is null then
    execute format('create table public.%I partition of public.analytics_events for values from (%L) to (%L)',
                   v_name, v_start, v_end);
    execute format('alter table public.%I enable row level security', v_name);
    execute format('revoke all on table public.%I from anon, authenticated', v_name);
  end if;
  return v_name;
end $$;

create table public.analytics_events_default partition of public.analytics_events default;
alter table public.analytics_events_default enable row level security;

do $$
declare m int;
begin
  for m in -1..12 loop
    perform public.ensure_analytics_partition((date_trunc('month', now()) + make_interval(months => m))::date);
  end loop;
end $$;

-- ---------- Support ----------
create sequence public.ticket_number_seq start 5001;

create table public.support_tickets (
  id                uuid primary key default gen_random_uuid(),
  ticket_number     text not null unique default ('TKT-' || nextval('public.ticket_number_seq')::text),
  user_id           uuid references public.profiles (id) on delete set null,
  email             text not null,
  order_id          uuid references public.orders (id) on delete set null,
  payment_id        uuid references public.payments (id) on delete set null,
  subject           text not null check (char_length(subject) between 1 and 200),
  category          text not null default 'other'
                    check (category in ('order', 'payment', 'shipping', 'return', 'product', 'account', 'other')),
  status            public.ticket_status not null default 'open',
  priority          public.ticket_priority not null default 'normal',
  channel           text not null default 'web' check (channel in ('web', 'email', 'phone', 'whatsapp', 'instagram')),
  assigned_to       uuid references public.profiles (id) on delete set null,
  first_response_at timestamptz,
  resolved_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index support_tickets_queue_idx    on public.support_tickets (status, priority, created_at)
  where status in ('open', 'pending_internal');
create index support_tickets_status_idx   on public.support_tickets (status, updated_at desc);
create index support_tickets_assignee_idx on public.support_tickets (assigned_to, status);
create index support_tickets_user_idx     on public.support_tickets (user_id, created_at desc);
create index support_tickets_email_idx    on public.support_tickets (lower(email));
create index support_tickets_order_idx    on public.support_tickets (order_id) where order_id is not null;
create index support_tickets_payment_idx  on public.support_tickets (payment_id) where payment_id is not null;

create table public.support_ticket_messages (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.support_tickets (id) on delete cascade,
  author_id   uuid references public.profiles (id) on delete set null,
  author_type text not null check (author_type in ('customer', 'staff', 'system')),
  body        text not null check (char_length(body) between 1 and 10000),
  is_internal boolean not null default false,  -- staff-only note, hidden from customer
  attachments jsonb not null default '[]' check (jsonb_typeof(attachments) = 'array'),
  created_at  timestamptz not null default now(),
  check (author_type = 'staff' or not is_internal)
);
create index support_ticket_messages_ticket_idx on public.support_ticket_messages (ticket_id, created_at);
create index support_ticket_messages_author_idx on public.support_ticket_messages (author_id);
