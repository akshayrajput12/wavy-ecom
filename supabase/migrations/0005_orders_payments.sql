-- =============================================================================
-- 0005 — Orders + payments
--   orders            immutable money snapshot of what the customer agreed to pay
--   order_items       line snapshots (name, variant title + options, price at time of purchase)
--   order_status_history  every status transition (trigger, 0014)
--   payment_gateways  admin on/off switch + non-secret config per provider
--   payments          one per (order, provider) "attempt series"
--   payment_attempts  every try: where it failed and why (support's main table)
--   payment_events    every webhook/callback, deduped on (provider, provider_event_id)
--   refunds
-- Double-payment guard: at most ONE successful payment and ONE successful attempt per order
-- (partial unique indexes). A second capture is recorded as attempt status 'duplicate'.
-- =============================================================================

create sequence public.order_number_seq start 100001;

create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  order_number        text not null unique default ('wavy-' || nextval('public.order_number_seq')::text),
  idempotency_key     text not null unique check (char_length(idempotency_key) between 8 and 200),
  checkout_session_id uuid unique references public.checkout_sessions (id) on delete set null,
  cart_id             uuid references public.carts (id) on delete set null,
  user_id             uuid references public.profiles (id) on delete set null,   -- null = guest
  visitor_session_id  uuid,
  status              public.order_status not null default 'pending_payment',
  payment_status      public.payment_status not null default 'initiated',
  payment_provider    public.payment_provider not null,
  -- contact + address snapshot
  email               text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone               text not null check (phone ~ '^\+?[0-9]{10,15}$'),
  customer_name       text not null,
  shipping_address    jsonb not null check (jsonb_typeof(shipping_address) = 'object'),
  billing_address     jsonb check (billing_address is null or jsonb_typeof(billing_address) = 'object'),
  shipping_method_id  uuid references public.shipping_methods (id) on delete set null,
  shipping_method_name text,
  -- money snapshot (paise)
  currency            char(3) not null default 'INR',
  subtotal            integer not null check (subtotal >= 0),
  discount_total      integer not null default 0 check (discount_total >= 0),
  shipping_total      integer not null default 0 check (shipping_total >= 0),
  cod_fee             integer not null default 0 check (cod_fee >= 0),
  tax_total           integer not null default 0 check (tax_total >= 0),
  total               integer not null check (total >= 0),
  tax_rate            numeric(5,2) not null check (tax_rate between 0 and 100),
  tax_inclusive       boolean not null,
  coupon_id           uuid,                    -- FK added in 0008
  coupon_code         text,
  applied_discounts   jsonb not null default '[]' check (jsonb_typeof(applied_discounts) = 'array'),
  pricing_snapshot    jsonb,                   -- full compute_pricing() output
  -- meta
  notes               text,
  customer_ip         inet,
  user_agent          text,
  tracking_token      text not null unique
                      default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  placed_at           timestamptz not null default now(),
  paid_at             timestamptz,
  cancelled_at        timestamptz,
  cancel_reason       text,
  delivered_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint orders_discount_le_subtotal check (discount_total <= subtotal),
  constraint orders_total_math check (
    total = subtotal - discount_total + shipping_total + cod_fee + case when tax_inclusive then 0 else tax_total end)
);
comment on column public.orders.tracking_token is 'Unguessable token for public /track/<token> page (get_order_tracking).';
create index orders_user_idx            on public.orders (user_id, placed_at desc);
create index orders_status_idx          on public.orders (status, placed_at desc);           -- admin list by status
create index orders_payment_status_idx  on public.orders (payment_status, placed_at desc);
create index orders_placed_at_idx       on public.orders (placed_at desc);
create index orders_email_idx           on public.orders (lower(email));
create index orders_phone_idx           on public.orders (phone);
create index orders_number_trgm_idx     on public.orders using gin (order_number extensions.gin_trgm_ops);
create index orders_email_trgm_idx      on public.orders using gin (email extensions.gin_trgm_ops);
create index orders_pending_payment_idx on public.orders (placed_at) where status = 'pending_payment';  -- sweeper
create index orders_coupon_idx          on public.orders (coupon_id) where coupon_id is not null;
create index orders_cart_idx            on public.orders (cart_id) where cart_id is not null;
create index orders_shipping_method_idx on public.orders (shipping_method_id);

create table public.order_items (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references public.orders (id) on delete cascade,
  product_id         uuid references public.products (id) on delete set null,
  variant_id         uuid references public.product_variants (id) on delete set null,
  sku                text not null,
  product_name       text not null,
  brand              text,
  variant_title      text not null,                    -- 'Black / M' ('Default' when the product has no options)
  options            jsonb not null default '[]' check (jsonb_typeof(options) = 'array'),   -- [{"name":"Color","value":"Black"}]
  hsn_code           text,                             -- GST invoice line
  return_window_days integer not null default 0 check (return_window_days >= 0),   -- policy at purchase; 0 = not returnable
  image_url          text,
  unit_price         integer not null check (unit_price >= 0),
  compare_at_price   integer,
  quantity           integer not null check (quantity > 0),
  line_subtotal      integer not null,
  discount_allocated integer not null default 0 check (discount_allocated >= 0),
  line_total         integer not null,
  created_at         timestamptz not null default now(),
  check (line_subtotal = unit_price * quantity),
  check (line_total = line_subtotal - discount_allocated)
);
create index order_items_order_idx   on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id, order_id);   -- verified-purchase lookup
create index order_items_variant_idx on public.order_items (variant_id);

create table public.order_status_history (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.orders (id) on delete cascade,
  from_status public.order_status,
  to_status   public.order_status not null,
  actor_id    uuid references public.profiles (id) on delete set null,
  actor_type  text not null default 'system' check (actor_type in ('system', 'customer', 'staff', 'webhook')),
  note        text,
  created_at  timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history (order_id, created_at);
create index order_status_history_actor_idx on public.order_status_history (actor_id) where actor_id is not null;

-- ---------- Gateways (admin toggles) ----------
create table public.payment_gateways (
  id                uuid primary key default gen_random_uuid(),
  provider          public.payment_provider not null unique,
  display_name      text not null,
  description       text,
  is_enabled        boolean not null default false,
  mode              public.gateway_mode not null default 'test',
  sort_order        integer not null default 0,
  supported_methods public.payment_method[] not null default '{}',
  min_amount        integer check (min_amount >= 0),
  max_amount        integer check (max_amount >= 0),
  -- Non-secret config only (public key_id, theme colour...). Secrets live in env / Vault.
  config            jsonb not null default '{}' check (jsonb_typeof(config) = 'object'),
  updated_by        uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint payment_gateways_no_secrets check (
    not (config ?| array['key_secret', 'secret', 'webhook_secret', 'salt', 'merchant_salt', 'api_secret', 'password']))
);
create index payment_gateways_enabled_idx on public.payment_gateways (sort_order) where is_enabled;
create index payment_gateways_updated_by_idx on public.payment_gateways (updated_by);

insert into public.payment_gateways (provider, display_name, description, is_enabled, mode, sort_order, supported_methods, config) values
  ('razorpay', 'Pay online', 'UPI, cards, netbanking and wallets via Razorpay', true,  'test', 1,
     '{upi,card,netbanking,wallet,emi,paylater}', '{"key_id": null, "theme_color": "#111111"}'),
  ('payu',     'PayU',       'Cards, UPI and netbanking via PayU',              false, 'test', 2,
     '{upi,card,netbanking,wallet}',              '{"merchant_key": null}'),
  ('cod',      'Cash on delivery', 'Pay in cash or UPI when your order arrives', true,  'live', 3,
     '{cod}',                                     '{}');

-- ---------- Payments ----------
create table public.payments (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references public.orders (id) on delete restrict,
  provider            public.payment_provider not null,
  status              public.payment_status not null default 'initiated',
  method              public.payment_method,
  amount              integer not null check (amount > 0),
  amount_captured     integer not null default 0 check (amount_captured >= 0),
  amount_refunded     integer not null default 0 check (amount_refunded >= 0),
  currency            char(3) not null default 'INR',
  provider_order_id   text,                    -- latest razorpay order_xxx
  provider_payment_id text,                    -- successful pay_xxx
  attempt_count       integer not null default 0,
  last_failure_stage  public.payment_failure_stage,
  last_failure_code   text,
  last_failure_reason text,
  authorized_at       timestamptz,
  captured_at         timestamptz,
  failed_at           timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (order_id, provider),
  check (amount_refunded <= amount_captured),
  check (amount_captured <= amount)
);
-- THE never-pay-twice guard: one successful payment per order.
create unique index payments_one_success_per_order_uidx on public.payments (order_id)
  where status in ('authorized', 'captured', 'refunded', 'partially_refunded');
create index payments_status_idx              on public.payments (status, created_at desc);
create index payments_provider_order_idx      on public.payments (provider_order_id) where provider_order_id is not null;
create unique index payments_provider_payment_uidx on public.payments (provider, provider_payment_id) where provider_payment_id is not null;
create index payments_failed_idx              on public.payments (last_failure_stage, failed_at desc) where status = 'failed';

create table public.payment_attempts (
  id                  uuid primary key default gen_random_uuid(),
  payment_id          uuid not null references public.payments (id) on delete cascade,
  order_id            uuid not null references public.orders (id) on delete cascade,   -- denormalised for lookups
  attempt_no          integer not null check (attempt_no > 0),
  provider            public.payment_provider not null,
  status              public.payment_attempt_status not null default 'created',
  method              public.payment_method,
  amount              integer not null check (amount >= 0),
  provider_order_id   text,
  provider_payment_id text,
  -- failure diagnostics
  failure_stage       public.payment_failure_stage,
  failure_source      text check (failure_source in ('customer', 'bank', 'gateway', 'business', 'internal')),
  failure_code        text,                    -- provider error code, e.g. BAD_REQUEST_ERROR
  failure_reason      text,                    -- provider description / our message
  method_details      jsonb,                   -- masked: {vpa:"ab***@okhdfc", bank:"HDFC", card_last4:"4242", network:"visa"}
  raw_request         jsonb,
  raw_response        jsonb,
  client_ip           inet,
  user_agent          text,
  started_at          timestamptz not null default now(),
  checkout_opened_at  timestamptz,
  completed_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (payment_id, attempt_no),
  check ((status in ('failed', 'cancelled')) = (failure_stage is not null) or status = 'duplicate')
);
create unique index payment_attempts_one_success_per_order_uidx on public.payment_attempts (order_id)
  where status in ('authorized', 'captured');
create unique index payment_attempts_provider_payment_uidx on public.payment_attempts (provider, provider_payment_id)
  where provider_payment_id is not null;
create index payment_attempts_order_idx          on public.payment_attempts (order_id, started_at);
create index payment_attempts_provider_order_idx on public.payment_attempts (provider_order_id) where provider_order_id is not null;
create index payment_attempts_status_idx         on public.payment_attempts (status, started_at desc);
create index payment_attempts_failure_idx        on public.payment_attempts (failure_stage, started_at desc) where failure_stage is not null;
create index payment_attempts_duplicate_idx      on public.payment_attempts (order_id) where status = 'duplicate';

create table public.payment_events (
  id                  uuid primary key default gen_random_uuid(),
  provider            public.payment_provider not null,
  provider_event_id   text not null,           -- webhook id, or 'callback:<pay_id>' for client callbacks
  event_type          text not null,           -- payment.captured, payment.failed, refund.processed...
  source              text not null default 'webhook' check (source in ('webhook', 'callback', 'poll', 'manual')),
  signature_valid     boolean,
  order_id            uuid references public.orders (id) on delete set null,
  payment_id          uuid references public.payments (id) on delete set null,
  attempt_id          uuid references public.payment_attempts (id) on delete set null,
  provider_order_id   text,
  provider_payment_id text,
  payload             jsonb not null,
  processing_status   text not null default 'received' check (processing_status in ('received', 'processed', 'ignored', 'failed')),
  processing_error    text,
  received_at         timestamptz not null default now(),
  processed_at        timestamptz,
  unique (provider, provider_event_id)       -- webhook idempotency
);
create index payment_events_order_idx      on public.payment_events (order_id, received_at);
create index payment_events_payment_idx    on public.payment_events (payment_id);
create index payment_events_attempt_idx    on public.payment_events (attempt_id);
create index payment_events_prov_order_idx on public.payment_events (provider_order_id) where provider_order_id is not null;
create index payment_events_prov_pay_idx   on public.payment_events (provider_payment_id) where provider_payment_id is not null;
create index payment_events_backlog_idx    on public.payment_events (received_at) where processing_status in ('received', 'failed');
create index payment_events_received_brin  on public.payment_events using brin (received_at);

create table public.refunds (
  id                 uuid primary key default gen_random_uuid(),
  payment_id         uuid not null references public.payments (id) on delete restrict,
  order_id           uuid not null references public.orders (id) on delete restrict,
  attempt_id         uuid references public.payment_attempts (id) on delete set null,  -- set for duplicate-capture refunds
  return_request_id  uuid,                    -- FK added in 0006
  amount             integer not null check (amount > 0),
  reason             text not null,
  status             public.refund_status not null default 'pending',
  provider_refund_id text,
  idempotency_key    text not null unique,
  initiated_by       uuid references public.profiles (id) on delete set null,
  failure_code       text,
  failure_reason     text,
  raw_request        jsonb,
  raw_response       jsonb,
  processed_at       timestamptz,
  failed_at          timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create unique index refunds_provider_refund_uidx on public.refunds (provider_refund_id) where provider_refund_id is not null;
create index refunds_payment_idx   on public.refunds (payment_id);
create index refunds_order_idx     on public.refunds (order_id);
create index refunds_status_idx    on public.refunds (status, created_at desc);
create index refunds_attempt_idx   on public.refunds (attempt_id) where attempt_id is not null;
create index refunds_initiated_by_idx on public.refunds (initiated_by);

-- deferred FKs from earlier migrations
alter table public.inventory_reservations add constraint inventory_reservations_order_fk
  foreign key (order_id) references public.orders (id) on delete cascade;
alter table public.carts add constraint carts_converted_order_fk
  foreign key (converted_order_id) references public.orders (id) on delete set null;
alter table public.checkout_sessions add constraint checkout_sessions_order_fk
  foreign key (order_id) references public.orders (id) on delete set null;
