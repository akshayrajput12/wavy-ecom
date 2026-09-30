-- =============================================================================
-- 0007 — Reviews (UGC + admin-authored)
-- source = 'customer': verified_purchase is computed by trigger (0014) from a DELIVERED order
--   item for the same user + product; any client-sent value is overwritten.
-- source = 'admin' | 'import': only staff with reviews.moderate (or service role) can write
--   these; author_name / verified_purchase / status are taken as given.
-- Approved reviews roll up into products.rating_avg / review_count (products.*_override win on display).
-- =============================================================================

create table public.reviews (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references public.products (id) on delete cascade,
  user_id           uuid references public.profiles (id) on delete set null,
  order_item_id     uuid references public.order_items (id) on delete set null,   -- set by trigger when verified
  rating            smallint not null check (rating between 1 and 5),
  title             text not null default '' check (char_length(title) <= 120),
  body              text not null default '' check (char_length(body) <= 5000),
  author_name       text not null check (char_length(author_name) between 1 and 60),
  author_location   text check (char_length(author_location) <= 60),   -- "Pune"
  source            public.review_source not null default 'customer',
  status            public.review_status not null default 'pending',
  verified_purchase boolean not null default false,
  helpful_count     integer not null default 0 check (helpful_count >= 0),
  not_helpful_count integer not null default 0 check (not_helpful_count >= 0),
  moderated_by      uuid references public.profiles (id) on delete set null,
  moderated_at      timestamptz,
  moderation_note   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create unique index reviews_one_per_user_product_uidx on public.reviews (product_id, user_id) where user_id is not null;
create index reviews_product_approved_idx on public.reviews (product_id, created_at desc) where status = 'approved';  -- PDP
create index reviews_product_helpful_idx  on public.reviews (product_id, helpful_count desc) where status = 'approved';
create index reviews_moderation_idx       on public.reviews (status, created_at) where status = 'pending';            -- queue
create index reviews_status_idx           on public.reviews (status, created_at desc);
create index reviews_user_idx             on public.reviews (user_id, created_at desc);
create index reviews_order_item_idx       on public.reviews (order_item_id) where order_item_id is not null;
create index reviews_moderated_by_idx     on public.reviews (moderated_by) where moderated_by is not null;
create index reviews_product_rating_idx   on public.reviews (product_id, rating) where status = 'approved';   -- star histogram

-- Customer uploads live in the private review-media bucket (storage_path); admin-authored
-- reviews may reference any public image url instead.
create table public.review_media (
  id           uuid primary key default gen_random_uuid(),
  review_id    uuid not null references public.reviews (id) on delete cascade,
  storage_path text unique,                    -- review-media/<user_id>/<review_id>/<file>
  url          text,                           -- public image (admin / import)
  alt          text not null default '',
  mime_type    text check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  width        integer,
  height       integer,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  check (num_nonnulls(storage_path, url) >= 1)
);
create index review_media_review_idx on public.review_media (review_id, sort_order);

create table public.review_votes (
  review_id  uuid not null references public.reviews (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  is_helpful boolean not null,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);
create index review_votes_user_idx on public.review_votes (user_id);
