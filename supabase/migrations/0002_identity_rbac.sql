-- =============================================================================
-- 0002 — Identity + RBAC
--   profiles        1:1 with auth.users, created by trigger on signup (role 'customer')
--   permissions     fine-grained capability codes ("catalog.write", "orders.refund", ...)
--   role_permissions role -> permission map (MUST match src/backend/_core/permissions.ts)
--   staff_members   invited staff lifecycle (invited -> active -> suspended)
-- profiles.role is the EFFECTIVE role. It is only changed by the staff_members trigger
-- (or bootstrap_super_admin), never by a client. See docs/database/RBAC.md.
-- =============================================================================

create table public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  email            text,
  full_name        text check (char_length(full_name) <= 120),
  phone            text check (phone ~ '^\+?[0-9]{10,15}$'),
  avatar_url       text,
  role             public.user_role not null default 'customer',
  status           public.account_status not null default 'active',
  marketing_opt_in boolean not null default false,
  last_seen_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
comment on table public.profiles is 'App user profile, 1:1 with auth.users. role = effective RBAC role.';
create unique index profiles_email_lower_uidx on public.profiles (lower(email));
create index profiles_staff_role_idx  on public.profiles (role) where role <> 'customer';
create index profiles_phone_idx       on public.profiles (phone) where phone is not null;
create index profiles_created_at_idx  on public.profiles (created_at desc);
create index profiles_email_trgm_idx  on public.profiles using gin (email extensions.gin_trgm_ops);
create index profiles_name_trgm_idx   on public.profiles using gin (full_name extensions.gin_trgm_ops);

create table public.permissions (
  code        text primary key check (code ~ '^[a-z_]+(\.[a-z_]+)+$'),
  module      text not null,
  description text not null,
  created_at  timestamptz not null default now()
);

create table public.role_permissions (
  role       public.user_role not null,
  permission text not null references public.permissions (code) on delete cascade on update cascade,
  created_at timestamptz not null default now(),
  primary key (role, permission)
);
create index role_permissions_permission_idx on public.role_permissions (permission);

create table public.staff_members (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid unique references public.profiles (id) on delete set null,
  email            text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  full_name        text,
  role             public.user_role not null check (role <> 'customer'),
  status           public.staff_status not null default 'invited',
  invited_by       uuid references public.profiles (id) on delete set null,
  invited_at       timestamptz not null default now(),
  activated_at     timestamptz,
  suspended_at     timestamptz,
  suspended_reason text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
comment on table public.staff_members is 'Staff invitations + lifecycle. Drives profiles.role via trigger.';
create unique index staff_members_email_uidx on public.staff_members (lower(email));
create index staff_members_status_idx   on public.staff_members (status, created_at desc);
create index staff_members_invited_by_idx on public.staff_members (invited_by);

-- ---------- Permission catalogue (reference data, required in every environment) ----------
insert into public.permissions (code, module, description) values
  ('catalog.read',              'catalog',     'View all products incl. drafts, categories, collections'),
  ('catalog.write',             'catalog',     'Create/edit products, variants, media, categories, collections'),
  ('catalog.publish',           'catalog',     'Publish / unpublish / archive products'),
  ('inventory.read',            'inventory',   'View stock, reservations and movement ledger'),
  ('inventory.write',           'inventory',   'Adjust stock levels'),
  ('orders.read',               'orders',      'View orders, items, status history, shipments'),
  ('orders.write',              'orders',      'Update order status, cancel, add notes'),
  ('orders.refund',             'orders',      'Issue refunds'),
  ('shipments.write',           'orders',      'Create/update shipments and tracking'),
  ('returns.read',              'returns',     'View return requests'),
  ('returns.write',             'returns',     'Approve/reject/process returns'),
  ('customers.read',            'customers',   'View customer profiles, addresses, carts, wishlists'),
  ('customers.write',           'customers',   'Edit customer profile/status (block, unblock)'),
  ('journey.read',              'customers',   'View a customer''s session/event timeline (support)'),
  ('payments.read',             'payments',    'View payments, attempts, provider events, refunds'),
  ('payments.gateway.manage',   'payments',    'Enable/disable/configure payment gateways'),
  ('marketing.read',            'marketing',   'View coupons, offers, campaigns'),
  ('coupons.write',             'marketing',   'Create/edit coupons'),
  ('offers.write',              'marketing',   'Create/edit offers (bundles, BOGO, tiers)'),
  ('campaigns.write',           'marketing',   'Create/edit campaigns'),
  ('testimonials.write',        'content',     'Create/edit testimonials'),
  ('content.write',             'content',     'Edit home page sections, FAQ, About, Lookbook and content pages'),
  ('seo.write',                 'content',     'Edit SEO overrides and redirects'),
  ('blog.write',                'content',     'Create/edit blog drafts'),
  ('blog.publish',              'content',     'Publish or schedule blog posts'),
  ('reviews.moderate',          'content',     'Approve/reject/hide reviews'),
  ('analytics.read',            'analytics',   'View analytics dashboards and events'),
  ('support.read',              'support',     'View support tickets and notification log'),
  ('support.write',             'support',     'Reply to / assign / resolve support tickets'),
  ('settings.read',             'settings',    'View store settings and integration status'),
  ('settings.write',            'settings',    'Edit general store settings'),
  ('settings.tax.manage',       'settings',    'Edit tax rate / GST / tax-inclusive pricing'),
  ('settings.shipping.manage',  'settings',    'Edit shipping zones, methods, COD rules'),
  ('integrations.manage',       'settings',    'Edit integration configs (non-secret)'),
  ('staff.manage',              'staff',       'Invite, change role, suspend staff'),
  ('audit.read',                'staff',       'View audit log');

-- Role map. KEEP IN SYNC with src/backend/_core/permissions.ts (checked by supabase/tests/validate.mjs).
insert into public.role_permissions (role, permission)
select 'super_admin', code from public.permissions
union all
select r.role::public.user_role, p.perm from (values
  ('catalog_manager',   array['catalog.read','catalog.write','catalog.publish','inventory.read','inventory.write',
                              'reviews.moderate','seo.write']),
  ('order_manager',     array['catalog.read','inventory.read','orders.read','orders.write','orders.refund',
                              'shipments.write','returns.read','returns.write','customers.read','journey.read',
                              'payments.read','support.read','settings.read','settings.shipping.manage']),
  ('marketing_manager', array['catalog.read','marketing.read','coupons.write','offers.write','campaigns.write',
                              'testimonials.write','content.write','seo.write','blog.write','blog.publish',
                              'reviews.moderate','analytics.read']),
  ('analyst',           array['catalog.read','marketing.read','analytics.read','orders.read']),
  ('support_agent',     array['catalog.read','orders.read','customers.read','journey.read','payments.read',
                              'returns.read','returns.write','support.read','support.write'])
) as r(role, perms)
cross join lateral unnest(r.perms) as p(perm);

-- ---------- RBAC helpers (used by RLS) ----------
-- Effective role of the current request (customer when anonymous / blocked).
create or replace function public.auth_role()
returns public.user_role language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select p.role from public.profiles p where p.id = auth.uid() and p.status = 'active'),
    'customer'::public.user_role);
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.auth_role() <> 'customer';
$$;

-- True when the signed-in user's role grants p_permission. super_admin short-circuits to true.
-- Wrap in (select ...) inside policies so Postgres evaluates it once per statement.
create or replace function public.has_permission(p_permission text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.profiles p
    left join public.role_permissions rp on rp.role = p.role and rp.permission = p_permission
    where p.id = auth.uid()
      and p.status = 'active'
      and p.role <> 'customer'
      and (p.role = 'super_admin' or rp.permission is not null)
  );
$$;

-- ---------- Supabase Custom Access Token Hook ----------
-- Enable in supabase/config.toml:
--   [auth.hook.custom_access_token]
--   enabled = true
--   uri = "pg-functions://postgres/public/custom_access_token_hook"
-- Adds claim  user_role  (effective role) to every issued JWT. The app uses it for fast
-- routing decisions (proxy.ts); the DB never trusts it and always re-checks profiles.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_role   public.user_role;
  v_claims jsonb := coalesce(event -> 'claims', '{}'::jsonb);
begin
  select p.role into v_role
  from public.profiles p
  where p.id = (event ->> 'user_id')::uuid and p.status = 'active';

  v_claims := jsonb_set(v_claims, '{user_role}', to_jsonb(coalesce(v_role, 'customer')::text));
  return jsonb_set(event, '{claims}', v_claims);
end $$;

-- ---------- Signup: create profile, link pending staff invite ----------
-- NOTE: role is NEVER read from raw_user_meta_data (clients control it at signup).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, phone, avatar_url, marketing_opt_in)
  values (
    new.id,
    new.email,
    nullif(left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 120), ''),
    case when new.phone ~ '^\+?[0-9]{10,15}$' then new.phone end,
    new.raw_user_meta_data ->> 'avatar_url',
    coalesce(new.raw_user_meta_data ->> 'marketing_opt_in', '') = 'true'
  )
  on conflict (id) do nothing;

  -- A staff invite created before the auth user existed gets linked here.
  update public.staff_members
     set user_id = new.id
   where user_id is null and new.email is not null and lower(email) = lower(new.email);
  return new;
end $$;

-- On sign-in: invited staff become active; keep profile email in sync with auth.
create or replace function public.handle_user_updated()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.last_sign_in_at is distinct from old.last_sign_in_at and new.last_sign_in_at is not null then
    update public.staff_members set status = 'active' where user_id = new.id and status = 'invited';
  end if;
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
create trigger on_auth_user_updated after update of last_sign_in_at, email on auth.users
  for each row execute function public.handle_user_updated();

-- ---------- staff_members -> profiles.role sync ----------
create or replace function public.sync_staff_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform set_config('wavy.role_sync', 'on', true);
  if tg_op = 'DELETE' then
    update public.profiles set role = 'customer' where id = old.user_id;
    perform set_config('wavy.role_sync', 'off', true);
    return old;
  end if;

  -- invite for someone who already has an account: link it now
  if new.user_id is null then
    new.user_id := (select p.id from public.profiles p where lower(p.email) = lower(new.email));
  end if;
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    if new.status = 'active' then new.activated_at := coalesce(new.activated_at, now()); new.suspended_at := null; end if;
    if new.status = 'suspended' then new.suspended_at := now(); end if;
  end if;
  -- user re-linked: demote the previous account
  if tg_op = 'UPDATE' and old.user_id is not null and old.user_id is distinct from new.user_id then
    update public.profiles set role = 'customer' where id = old.user_id;
  end if;
  if new.user_id is not null then
    update public.profiles
       set role = case when new.status = 'active' then new.role else 'customer'::public.user_role end
     where id = new.user_id;
  end if;
  perform set_config('wavy.role_sync', 'off', true);
  return new;
end $$;

create trigger staff_members_sync_role before insert or update or delete on public.staff_members
  for each row execute function public.sync_staff_role();

-- ---------- Guard: clients cannot escalate ----------
create or replace function public.guard_profile_write()
returns trigger language plpgsql set search_path = '' as $$
begin
  if coalesce(current_setting('wavy.role_sync', true), 'off') <> 'on' then
    if (tg_op = 'INSERT' and new.role <> 'customer') or (tg_op = 'UPDATE' and new.role is distinct from old.role) then
      raise exception 'profiles.role is managed through staff_members' using errcode = '42501';
    end if;
  end if;
  if tg_op = 'UPDATE'
     and (new.status is distinct from old.status or new.email is distinct from old.email)
     and not (public.is_service_role() or public.has_permission('customers.write')) then
    raise exception 'not allowed to change status or email' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger profiles_guard before insert or update on public.profiles
  for each row execute function public.guard_profile_write();

-- ---------- Bootstrap the first super admin (run once from SQL editor / service role) ----------
create or replace function public.bootstrap_super_admin(p_email text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  insert into public.staff_members (email, role, status, user_id)
  values (lower(p_email), 'super_admin', 'active',
          (select u.id from auth.users u where lower(u.email) = lower(p_email)))
  on conflict ((lower(email))) do update set role = 'super_admin', status = 'active'
  returning id into v_id;
  return v_id;
end $$;
