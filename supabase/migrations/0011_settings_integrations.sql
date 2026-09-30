-- =============================================================================
-- 0011 — Store settings (typed singleton), integration configs, notification log
-- No secrets in the database: integration_configs.secret_ref names the env var / Vault key.
-- =============================================================================

create table public.store_settings (
  id                      boolean primary key default true check (id),   -- singleton row
  store_name              text not null default 'wavy',
  currency                char(3) not null default 'INR',
  locale                  text not null default 'en-IN',
  timezone                text not null default 'Asia/Kolkata',
  -- tax (guarded by settings.tax.manage)
  tax_percentage          numeric(5,2) not null default 12 check (tax_percentage between 0 and 100),
  tax_inclusive           boolean not null default true,      -- Indian retail prices are GST-inclusive
  gst_number              text check (gst_number ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'),
  -- shipping / COD
  free_shipping_threshold integer check (free_shipping_threshold >= 0),
  flat_shipping_fee       integer not null default 9900 check (flat_shipping_fee >= 0),   -- when no method matches
  cod_enabled             boolean not null default true,
  cod_fee                 integer not null default 0 check (cod_fee >= 0),
  cod_max_order_amount    integer check (cod_max_order_amount > 0),
  -- policy
  return_window_days      integer not null default 7 check (return_window_days between 0 and 90),   -- products.return_window_days overrides
  reservation_ttl_minutes integer not null default 30 check (reservation_ttl_minutes between 5 and 1440),
  low_stock_default       integer not null default 3 check (low_stock_default >= 0),
  support_email           text,
  support_phone           text,
  updated_by              uuid references public.profiles (id) on delete set null,
  updated_at              timestamptz not null default now()
);
insert into public.store_settings (id, free_shipping_threshold, cod_fee, cod_max_order_amount, support_email)
values (true, 149900, 4900, 1000000, 'support@wavy.store');

create table public.integration_configs (
  id              uuid primary key default gen_random_uuid(),
  provider        text not null check (provider in ('razorpay', 'payu', 'shiprocket', 'resend', 'ga4', 'posthog')),
  environment     text not null default 'test' check (environment in ('test', 'live')),
  is_active       boolean not null default false,
  status          public.integration_status not null default 'disconnected',
  config          jsonb not null default '{}' check (jsonb_typeof(config) = 'object'),   -- non-secret only
  secret_ref      text,                         -- e.g. 'RAZORPAY_KEY_SECRET' (name, never value)
  last_checked_at timestamptz,
  last_error      text,
  last_error_at   timestamptz,
  updated_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (provider, environment),
  constraint integration_configs_no_secrets check (
    not (config ?| array['key_secret', 'secret', 'webhook_secret', 'api_key', 'api_secret', 'password', 'token', 'salt']))
);
create index integration_configs_status_idx on public.integration_configs (status) where is_active;
create index integration_configs_updated_by_idx on public.integration_configs (updated_by);

insert into public.integration_configs (provider, environment, secret_ref, config) values
  ('razorpay',   'test', 'RAZORPAY_KEY_SECRET',  '{"key_id": null, "webhook_url": "/api/payments/webhooks/razorpay"}'),
  ('payu',       'test', 'PAYU_MERCHANT_SALT',   '{"merchant_key": null}'),
  ('shiprocket', 'test', 'SHIPROCKET_PASSWORD',  '{"email": null, "pickup_location": "Primary"}'),
  ('resend',     'test', 'RESEND_API_KEY',       '{"from": "wavy <orders@wavy.store>"}'),
  ('ga4',        'live', null,                   '{"measurement_id": null}'),
  ('posthog',    'live', 'POSTHOG_KEY',          '{"host": "https://eu.i.posthog.com"}');

-- Every transactional message. idempotency_key (e.g. 'order_confirmed:<order_id>') stops double emails.
create table public.notification_log (
  id                  uuid primary key default gen_random_uuid(),
  channel             text not null default 'email' check (channel in ('email', 'sms', 'whatsapp')),
  provider            text not null default 'resend',
  template            text not null,            -- order_confirmed, payment_failed, shipped, return_approved...
  idempotency_key     text unique,
  to_address          text not null,
  subject             text,
  user_id             uuid references public.profiles (id) on delete set null,
  order_id            uuid references public.orders (id) on delete set null,
  status              public.notification_status not null default 'queued',
  provider_message_id text unique,
  error               text,
  payload             jsonb not null default '{}',
  sent_at             timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index notification_log_order_idx  on public.notification_log (order_id, created_at) where order_id is not null;
create index notification_log_user_idx   on public.notification_log (user_id, created_at desc) where user_id is not null;
create index notification_log_status_idx on public.notification_log (status, created_at desc);
create index notification_log_to_idx     on public.notification_log (lower(to_address), created_at desc);
