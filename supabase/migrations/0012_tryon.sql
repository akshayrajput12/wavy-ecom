-- =============================================================================
-- 0012 — Virtual try-on sessions
-- Photos live in the PRIVATE bucket 'tryon-private' under <owner>/<session_id>/...
-- Sessions expire (expires_at); cleanup_expired_tryon_sessions() marks them expired and
-- returns the storage paths the backend must delete through the Storage API.
-- Output is visualization-only: never used as a fit/size guarantee.
-- =============================================================================

create table public.tryon_sessions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references public.profiles (id) on delete set null,
  anonymous_id       text,
  visitor_session_id uuid references public.visitor_sessions (id) on delete set null,
  product_id         uuid not null references public.products (id) on delete cascade,
  variant_id         uuid references public.product_variants (id) on delete set null,
  status             public.tryon_status not null default 'created',
  provider           text,                     -- 'mediapipe_local' | vendor name
  provider_job_id    text,
  source_path        text,                     -- tryon-private/<owner>/<id>/source.jpg
  result_path        text,
  source_mime        text check (source_mime in ('image/jpeg', 'image/png', 'image/webp')),
  source_bytes       integer check (source_bytes between 1 and 10485760),
  consent_at         timestamptz,              -- user accepted the visualization-only notice
  cost_paise         integer check (cost_paise >= 0),
  latency_ms         integer check (latency_ms >= 0),
  error_class        public.tryon_error_class,
  error_message      text,
  expires_at         timestamptz not null default now() + interval '24 hours',
  completed_at       timestamptz,
  deleted_at         timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (user_id is not null or anonymous_id is not null),
  check (status <> 'failed' or error_class is not null)
);
create index tryon_sessions_user_idx     on public.tryon_sessions (user_id, created_at desc) where user_id is not null;
create index tryon_sessions_anon_idx     on public.tryon_sessions (anonymous_id, created_at desc) where anonymous_id is not null;
create index tryon_sessions_product_idx  on public.tryon_sessions (product_id, created_at desc);
create index tryon_sessions_status_idx   on public.tryon_sessions (status, created_at desc);
create index tryon_sessions_expiry_idx   on public.tryon_sessions (expires_at) where status not in ('expired', 'deleted');
create index tryon_sessions_provider_idx on public.tryon_sessions (provider, created_at desc);
create index tryon_sessions_variant_idx  on public.tryon_sessions (variant_id) where variant_id is not null;
create index tryon_sessions_visitor_idx  on public.tryon_sessions (visitor_session_id) where visitor_session_id is not null;

-- Marks expired sessions and hands back the files to delete. Idempotent; run from a cron job
-- (e.g. /api/cron/tryon-cleanup every 15 min) which then calls storage.from('tryon-private').remove(paths).
create or replace function public.cleanup_expired_tryon_sessions(p_limit integer default 500)
returns table (session_id uuid, source_path text, result_path text)
language plpgsql security definer set search_path = '' as $$
begin
  return query
  with due as (
    select t.id from public.tryon_sessions t
    where t.expires_at <= now() and t.status not in ('expired', 'deleted')
    order by t.expires_at
    limit p_limit
    for update skip locked
  ), prev as (
    select t.id, t.source_path, t.result_path from public.tryon_sessions t join due using (id)
  ), upd as (
    update public.tryon_sessions t
       set status = 'expired', source_path = null, result_path = null, deleted_at = now()
      from due where t.id = due.id
    returning t.id
  )
  select prev.id, prev.source_path, prev.result_path from prev join upd on upd.id = prev.id;
end $$;
