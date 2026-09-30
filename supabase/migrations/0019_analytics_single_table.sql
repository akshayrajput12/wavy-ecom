-- =============================================================================
-- 0019 analytics_events: monthly partitions -> one plain table.
-- ponytail: partitions only pay off at hundreds of millions of rows; at store scale they are
-- 15 empty tables and a cron job. BRIN + btree indexes keep time-range scans cheap.
-- If volume ever needs it: re-partition, or move raw events to PostHog/warehouse (already wired).
-- Safe on fresh installs and on DBs that already ran 0010 (converts only when still partitioned).
-- =============================================================================
do $$
begin
  -- nested + dynamic SQL: cron.job must not be referenced at all when pg_cron isn't installed
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    execute $q$select cron.unschedule(jobid) from cron.job where jobname = 'wavy-analytics-partitions'$q$;
  end if;
end $$;

do $$
begin
  if (select relkind from pg_class where oid = 'public.analytics_events'::regclass) <> 'p' then
    return;
  end if;

  create table public.analytics_events_flat (
    id                 uuid primary key default gen_random_uuid(),
    created_at         timestamptz not null default now(),
    event_name         public.analytics_event_name not null,
    visitor_session_id uuid,
    anonymous_id       text,
    user_id            uuid,
    path               text,
    page_type          text,
    referrer           text,
    product_id         uuid,
    variant_id         uuid,
    order_id           uuid,
    properties         jsonb not null default '{}' check (jsonb_typeof(properties) = 'object'),
    source             text not null default 'web' check (source in ('web', 'server'))
  );
  insert into public.analytics_events_flat
  select id, created_at, event_name, visitor_session_id, anonymous_id, user_id, path, page_type, referrer,
         product_id, variant_id, order_id, properties, source
    from public.analytics_events;

  drop table public.analytics_events cascade;   -- drops every analytics_events_YYYY_MM + default partition
  alter table public.analytics_events_flat rename to analytics_events;
  alter table public.analytics_events rename constraint analytics_events_flat_pkey to analytics_events_pkey;
end $$;

drop function if exists public.ensure_analytics_partition(date);

comment on table public.analytics_events is 'First-party analytics events (single table; BRIN on created_at).';
create index if not exists analytics_events_created_brin on public.analytics_events using brin (created_at);
create index if not exists analytics_events_name_idx     on public.analytics_events (event_name, created_at desc);
create index if not exists analytics_events_user_idx     on public.analytics_events (user_id, created_at desc) where user_id is not null;
create index if not exists analytics_events_session_idx  on public.analytics_events (visitor_session_id, created_at);
create index if not exists analytics_events_anon_idx     on public.analytics_events (anonymous_id, created_at desc) where anonymous_id is not null;
create index if not exists analytics_events_product_idx  on public.analytics_events (product_id, event_name, created_at) where product_id is not null;
create index if not exists analytics_events_order_idx    on public.analytics_events (order_id) where order_id is not null;

-- RLS + grants exactly as 0016 set them on the old table.
alter table public.analytics_events enable row level security;
drop policy if exists staff_read_analytics_read on public.analytics_events;
drop policy if exists staff_read_journey_read   on public.analytics_events;
create policy staff_read_analytics_read on public.analytics_events for select to authenticated
  using ((select public.has_permission('analytics.read')));
create policy staff_read_journey_read on public.analytics_events for select to authenticated
  using ((select public.has_permission('journey.read')));
revoke all on public.analytics_events from anon;
revoke insert, update, delete, truncate, references, trigger on public.analytics_events from authenticated;
