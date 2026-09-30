-- =============================================================================
-- 0006 — Shipments (Shiprocket), tracking timeline, returns
-- Public tracking is served by get_order_tracking(token) (0014), never by table reads.
-- =============================================================================

create table public.shipments (
  id                   uuid primary key default gen_random_uuid(),
  order_id             uuid not null references public.orders (id) on delete cascade,
  direction            text not null default 'forward' check (direction in ('forward', 'return')),
  return_request_id    uuid,                    -- FK below (return pickups)
  provider             text not null default 'shiprocket' check (provider in ('shiprocket', 'manual')),
  provider_order_id    text,                    -- Shiprocket order_id
  provider_shipment_id text,                    -- Shiprocket shipment_id
  awb                  text,
  courier_name         text,
  courier_code         text,
  tracking_url         text,
  status               public.shipment_status not null default 'created',
  eta                  date,
  label_url            text,
  manifest_url         text,
  weight_grams         integer check (weight_grams > 0),
  dimensions_cm        jsonb,                   -- {l,w,h}
  shipped_at           timestamptz,
  delivered_at         timestamptz,
  last_synced_at       timestamptz,
  raw                  jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create unique index shipments_awb_uidx on public.shipments (awb) where awb is not null;
create index shipments_order_idx     on public.shipments (order_id);
create index shipments_status_idx    on public.shipments (status, updated_at desc);
create index shipments_sync_idx      on public.shipments (last_synced_at nulls first)
  where status not in ('delivered', 'cancelled');                                   -- tracking poller
create index shipments_provider_ship_idx on public.shipments (provider_shipment_id) where provider_shipment_id is not null;
create index shipments_return_idx    on public.shipments (return_request_id) where return_request_id is not null;

create table public.shipment_items (
  shipment_id   uuid not null references public.shipments (id) on delete cascade,
  order_item_id uuid not null references public.order_items (id) on delete cascade,
  quantity      integer not null check (quantity > 0),
  primary key (shipment_id, order_item_id)
);
create index shipment_items_order_item_idx on public.shipment_items (order_item_id);

create table public.shipment_events (
  id                uuid primary key default gen_random_uuid(),
  shipment_id       uuid not null references public.shipments (id) on delete cascade,
  status            public.shipment_status not null,
  provider_status   text,                      -- raw courier status text
  location          text,
  note              text,
  occurred_at       timestamptz not null,
  provider_event_id text,                      -- dedupe webhook/poll repeats
  raw               jsonb,
  created_at        timestamptz not null default now(),
  unique (shipment_id, provider_event_id)
);
create index shipment_events_timeline_idx on public.shipment_events (shipment_id, occurred_at);

-- ---------- Returns ----------
create sequence public.return_number_seq start 10001;

create table public.return_requests (
  id                 uuid primary key default gen_random_uuid(),
  rma_number         text not null unique default ('RET-' || nextval('public.return_number_seq')::text),
  order_id           uuid not null references public.orders (id) on delete cascade,
  user_id            uuid references public.profiles (id) on delete set null,
  status             public.return_status not null default 'requested',
  reason             public.return_reason not null,
  customer_note      text check (char_length(customer_note) <= 2000),
  resolution         text not null default 'refund' check (resolution in ('refund', 'exchange', 'store_credit')),
  refund_amount      integer check (refund_amount >= 0),
  reviewed_by        uuid references public.profiles (id) on delete set null,
  reviewed_at        timestamptz,
  rejection_reason   text,
  pickup_shipment_id uuid references public.shipments (id) on delete set null,
  received_at        timestamptz,
  closed_at          timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (status <> 'rejected' or rejection_reason is not null)
);
create index return_requests_order_idx  on public.return_requests (order_id);
create index return_requests_user_idx   on public.return_requests (user_id, created_at desc);
create index return_requests_status_idx on public.return_requests (status, created_at desc);
create index return_requests_reviewer_idx on public.return_requests (reviewed_by) where reviewed_by is not null;
create index return_requests_pickup_idx on public.return_requests (pickup_shipment_id) where pickup_shipment_id is not null;

create table public.return_items (
  id                uuid primary key default gen_random_uuid(),
  return_request_id uuid not null references public.return_requests (id) on delete cascade,
  order_item_id     uuid not null references public.order_items (id) on delete cascade,
  quantity          integer not null check (quantity > 0),
  reason            public.return_reason,
  condition         text check (condition in ('unused', 'used', 'damaged', 'missing')),   -- set on receipt
  restocked         boolean not null default false,
  created_at        timestamptz not null default now(),
  unique (return_request_id, order_item_id)
);
create index return_items_order_item_idx on public.return_items (order_item_id);

-- Customer photos/videos proving the problem. Files live in private bucket 'return-evidence'.
create table public.return_evidence (
  id                uuid primary key default gen_random_uuid(),
  return_request_id uuid not null references public.return_requests (id) on delete cascade,
  storage_path      text not null unique,      -- return-evidence/<user_id>/<return_id>/<file>
  mime_type         text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'video/mp4')),
  size_bytes        integer check (size_bytes between 1 and 26214400),
  created_at        timestamptz not null default now()
);
create index return_evidence_request_idx on public.return_evidence (return_request_id);

alter table public.shipments add constraint shipments_return_request_fk
  foreign key (return_request_id) references public.return_requests (id) on delete set null;
alter table public.refunds add constraint refunds_return_request_fk
  foreign key (return_request_id) references public.return_requests (id) on delete set null;
create index refunds_return_request_idx on public.refunds (return_request_id) where return_request_id is not null;
