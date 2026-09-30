-- =============================================================================
-- 0004 — Addresses, shipping zones/methods, carts, checkout sessions
-- Anonymous carts are keyed by an opaque session_id cookie and are only touched
-- through the backend (service role). Signed-in carts are also readable via RLS.
-- =============================================================================

create table public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  label       text check (char_length(label) <= 30),        -- "Home", "Work"
  name        text not null check (char_length(name) between 1 and 120),
  phone       text not null check (phone ~ '^\+?[0-9]{10,15}$'),
  line1       text not null check (char_length(line1) between 1 and 200),
  line2       text check (char_length(line2) <= 200),
  landmark    text check (char_length(landmark) <= 120),
  city        text not null check (char_length(city) between 1 and 80),
  state       text not null check (char_length(state) between 1 and 80),
  postal_code text not null,
  country     char(2) not null default 'IN' check (country ~ '^[A-Z]{2}$'),
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (country <> 'IN' or postal_code ~ '^[1-9][0-9]{5}$')
);
create index addresses_user_idx on public.addresses (user_id, created_at desc);
create unique index addresses_one_default_uidx on public.addresses (user_id) where is_default;

-- ---------- Shipping ----------
create table public.shipping_zones (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  states     text[] not null default '{}',     -- state names as captured in addresses.state
  is_default boolean not null default false,   -- fallback zone for unmatched states
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index shipping_zones_states_idx on public.shipping_zones using gin (states);
create unique index shipping_zones_one_default_uidx on public.shipping_zones ((true)) where is_default;

create table public.shipping_methods (
  id            uuid primary key default gen_random_uuid(),
  zone_id       uuid not null references public.shipping_zones (id) on delete cascade,
  code          text not null unique check (code ~ '^[a-z0-9_]+$'),
  name          text not null,
  description   text,
  rate          integer not null check (rate >= 0),            -- paise
  free_above    integer check (free_above >= 0),               -- overrides store threshold when set
  cod_available boolean not null default true,
  min_days      integer not null default 3 check (min_days >= 0),
  max_days      integer not null default 7,
  is_active     boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (max_days >= min_days)
);
create index shipping_methods_zone_idx on public.shipping_methods (zone_id, sort_order) where is_active;

-- ---------- Carts ----------
create table public.carts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references public.profiles (id) on delete cascade,
  session_id         text check (char_length(session_id) between 16 and 128),
  status             public.cart_status not null default 'active',
  coupon_code        text,
  currency           char(3) not null default 'INR',
  converted_order_id uuid,                       -- FK added in 0005
  merged_into_id     uuid references public.carts (id) on delete set null,
  last_activity_at   timestamptz not null default now(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (user_id is not null or session_id is not null)
);
create unique index carts_active_user_uidx    on public.carts (user_id)    where status = 'active' and user_id is not null;
create unique index carts_active_session_uidx on public.carts (session_id) where status = 'active' and session_id is not null;
create index carts_abandoned_scan_idx on public.carts (last_activity_at) where status = 'active';   -- abandoned-cart job
create index carts_converted_order_idx on public.carts (converted_order_id) where converted_order_id is not null;
create index carts_merged_into_idx on public.carts (merged_into_id) where merged_into_id is not null;

create table public.cart_items (
  id                  uuid primary key default gen_random_uuid(),
  cart_id             uuid not null references public.carts (id) on delete cascade,
  variant_id          uuid not null references public.product_variants (id) on delete cascade,
  quantity            integer not null check (quantity between 1 and 10),
  unit_price_snapshot integer not null default 0 check (unit_price_snapshot >= 0),  -- set by trigger; display only
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (cart_id, variant_id)
);
create index cart_items_variant_idx on public.cart_items (variant_id);

-- ---------- Checkout sessions ----------
-- One per "Place order" intent. idempotency_key is generated client-side once per checkout
-- and re-sent on every retry; the same key always maps to the same order.
create table public.checkout_sessions (
  id                 uuid primary key default gen_random_uuid(),
  idempotency_key    text not null unique check (char_length(idempotency_key) between 8 and 200),
  cart_id            uuid references public.carts (id) on delete set null,
  user_id            uuid references public.profiles (id) on delete set null,
  visitor_session_id uuid,
  email              text,
  phone              text,
  customer_name      text,
  shipping_address   jsonb check (shipping_address is null or jsonb_typeof(shipping_address) = 'object'),
  billing_address    jsonb check (billing_address is null or jsonb_typeof(billing_address) = 'object'),
  shipping_method_id uuid references public.shipping_methods (id) on delete set null,
  coupon_code        text,
  payment_provider   public.payment_provider,
  quote              jsonb,                      -- last server-computed totals
  status             public.checkout_status not null default 'open',
  order_id           uuid,                       -- FK added in 0005
  expires_at         timestamptz not null default now() + interval '1 hour',
  completed_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index checkout_sessions_cart_idx   on public.checkout_sessions (cart_id);
create index checkout_sessions_user_idx   on public.checkout_sessions (user_id, created_at desc);
create index checkout_sessions_open_idx   on public.checkout_sessions (expires_at) where status in ('open', 'payment_pending');
create index checkout_sessions_email_idx  on public.checkout_sessions (lower(email));
create index checkout_sessions_method_idx on public.checkout_sessions (shipping_method_id);
create index checkout_sessions_order_idx  on public.checkout_sessions (order_id) where order_id is not null;

alter table public.inventory_reservations
  add constraint inventory_reservations_checkout_fk
  foreign key (checkout_session_id) references public.checkout_sessions (id) on delete set null;
