-- =============================================================================
-- 0003 — Catalog: categories, collections, products, media, variants, inventory,
--        filter attributes, related products, wishlist
-- =============================================================================

-- ---------- Categories (tree) ----------
create table public.categories (
  id              uuid primary key default gen_random_uuid(),
  parent_id       uuid references public.categories (id) on delete restrict,
  name            text not null check (char_length(name) between 1 and 80),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description     text,
  image_url       text,
  image_alt       text,
  sort_order      integer not null default 0,
  is_active       boolean not null default true,
  seo_title       text,
  seo_description text,
  og_image_url    text,
  canonical_url   text,
  noindex         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (parent_id is null or parent_id <> id)
);
create index categories_parent_idx on public.categories (parent_id, sort_order);
create index categories_active_idx on public.categories (sort_order) where is_active;

-- Ancestors of a category including itself (used by discount targeting / breadcrumbs).
create or replace function public.category_path(p_category_id uuid)
returns uuid[] language sql stable set search_path = '' as $$
  with recursive up as (
    select c.id, c.parent_id, 1 as depth from public.categories c where c.id = p_category_id
    union all
    select c.id, c.parent_id, up.depth + 1 from public.categories c join up on c.id = up.parent_id where up.depth < 10
  )
  select coalesce(array_agg(id order by depth), '{}') from up;
$$;

-- ---------- Collections ----------
create table public.collections (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (char_length(name) between 1 and 80),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description     text,
  image_url       text,
  image_alt       text,
  sort_order      integer not null default 0,
  is_active       boolean not null default true,
  is_featured     boolean not null default false,
  starts_at       timestamptz,
  ends_at         timestamptz,
  seo_title       text,
  seo_description text,
  og_image_url    text,
  canonical_url   text,
  noindex         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create index collections_active_idx   on public.collections (sort_order) where is_active;
create index collections_featured_idx on public.collections (sort_order) where is_active and is_featured;

-- ---------- Products ----------
create table public.products (
  id               uuid primary key default gen_random_uuid(),
  category_id      uuid not null references public.categories (id) on delete restrict,
  name             text not null check (char_length(name) between 1 and 140),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  descriptor       text not null default '',            -- short line under the name ("Heavyweight cotton")
  description      text not null default '',
  material         text,
  fit              text,
  care             text,
  badges           text[] not null default '{}',        -- "New", "Bestseller"...
  search_keywords  text,                                -- admin synonyms, boosts search
  status           public.product_status not null default 'draft',
  published_at     timestamptz,
  try_on_enabled   boolean not null default false,
  size_chart       jsonb,                               -- { unit, rows:[...] }
  hsn_code         text,                                -- GST HSN (6109 tees, 6403 footwear)
  -- denormalised, maintained by triggers (0014)
  price_min        integer check (price_min >= 0),
  price_max        integer check (price_max >= 0),
  compare_at_min   integer check (compare_at_min >= 0),
  rating_avg       numeric(3,2) not null default 0 check (rating_avg between 0 and 5),
  review_count     integer not null default 0 check (review_count >= 0),
  -- SEO
  seo_title        text check (char_length(seo_title) <= 70),
  seo_description  text check (char_length(seo_description) <= 170),
  og_image_url     text,
  canonical_url    text,
  noindex          boolean not null default false,
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  search_vector    tsvector generated always as (
      setweight(to_tsvector('english'::regconfig, coalesce(name, '')), 'A')
   || setweight(to_tsvector('english'::regconfig, coalesce(descriptor, '') || ' ' || coalesce(search_keywords, '')), 'B')
   || setweight(to_tsvector('english'::regconfig, coalesce(material, '') || ' ' || coalesce(fit, '')), 'C')
   || setweight(to_tsvector('english'::regconfig, coalesce(description, '')), 'D')
  ) stored
);
comment on column public.products.search_vector is 'FTS document; query with websearch_to_tsquery(''english'', q).';
create index products_search_idx        on public.products using gin (search_vector);
create index products_name_trgm_idx     on public.products using gin (name extensions.gin_trgm_ops);
create index products_category_idx      on public.products (category_id);
create index products_status_idx        on public.products (status, updated_at desc);          -- admin list
create index products_published_new_idx on public.products (published_at desc) where status = 'published';  -- "new in"
create index products_published_price_idx on public.products (price_min) where status = 'published';        -- price sort/filter
create index products_published_cat_idx on public.products (category_id, published_at desc) where status = 'published';
create index products_published_rating_idx on public.products (rating_avg desc, review_count desc) where status = 'published';
create index products_tryon_idx         on public.products (id) where try_on_enabled and status = 'published';
create index products_created_by_idx    on public.products (created_by);

-- ---------- Collection membership ----------
create table public.collection_products (
  collection_id uuid not null references public.collections (id) on delete cascade,
  product_id    uuid not null references public.products (id) on delete cascade,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  primary key (collection_id, product_id)
);
create index collection_products_product_idx on public.collection_products (product_id);
create index collection_products_order_idx   on public.collection_products (collection_id, sort_order);

-- ---------- Variants ----------
create table public.product_variants (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  sku          text not null unique check (sku ~ '^[A-Z0-9][A-Z0-9-]{2,63}$'),
  barcode      text unique,
  color        text not null check (char_length(color) between 1 and 40),
  color_hex    text check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  size         text not null check (char_length(size) between 1 and 16),
  size_sort    integer not null default 0,               -- XS=10,S=20... / UK6=60...
  price        integer not null check (price > 0),
  compare_at   integer,
  weight_grams integer check (weight_grams > 0),
  status       public.variant_status not null default 'active',
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (product_id, color, size),
  check (compare_at is null or compare_at > price)
);
create index product_variants_product_idx   on public.product_variants (product_id, sort_order);
create index product_variants_sku_trgm_idx  on public.product_variants using gin (sku extensions.gin_trgm_ops);
create index product_variants_color_idx     on public.product_variants (lower(color), product_id) where status <> 'disabled';
create index product_variants_size_idx      on public.product_variants (size, product_id) where status <> 'disabled';
create index product_variants_price_idx     on public.product_variants (price) where status = 'active';

-- ---------- Media ----------
create table public.product_media (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  variant_id   uuid references public.product_variants (id) on delete set null,
  color        text,                                    -- image belongs to a colourway
  media_type   text not null default 'image' check (media_type in ('image', 'video')),
  url          text not null,
  storage_path text,                                    -- product-media bucket path when self-hosted
  alt          text not null default '',
  width        integer check (width > 0),
  height       integer check (height > 0),
  sort_order   integer not null default 0,
  is_primary   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index product_media_product_idx on public.product_media (product_id, sort_order);
create index product_media_variant_idx on public.product_media (variant_id) where variant_id is not null;
create unique index product_media_one_primary_uidx on public.product_media (product_id) where is_primary;

-- ---------- Inventory (one row per variant) ----------
create table public.inventory (
  variant_id          uuid primary key references public.product_variants (id) on delete cascade,
  on_hand             integer not null default 0 check (on_hand >= 0),
  reserved            integer not null default 0 check (reserved >= 0),
  available           integer generated always as (on_hand - reserved) stored,
  low_stock_threshold integer not null default 3 check (low_stock_threshold >= 0),
  updated_at          timestamptz not null default now(),
  -- Last line of defence against overselling; functions also lock rows FOR UPDATE.
  constraint inventory_no_oversell check (on_hand - reserved >= 0)
);
create index inventory_low_stock_idx on public.inventory (available) where available <= low_stock_threshold;

-- Temporary holds while a customer pays (released on failure/expiry, consumed on capture).
create table public.inventory_reservations (
  id                  uuid primary key default gen_random_uuid(),
  variant_id          uuid not null references public.product_variants (id) on delete cascade,
  quantity            integer not null check (quantity > 0),
  status              public.reservation_status not null default 'active',
  order_id            uuid,                              -- FK added in 0005
  checkout_session_id uuid,                              -- FK added in 0004
  expires_at          timestamptz,
  released_at         timestamptz,
  consumed_at         timestamptz,
  created_at          timestamptz not null default now()
);
create index inventory_reservations_order_idx   on public.inventory_reservations (order_id);
create index inventory_reservations_variant_idx on public.inventory_reservations (variant_id) where status = 'active';
create index inventory_reservations_expiry_idx  on public.inventory_reservations (expires_at) where status = 'active';
create index inventory_reservations_checkout_idx on public.inventory_reservations (checkout_session_id) where checkout_session_id is not null;

-- Append-only stock ledger.
create table public.inventory_movements (
  id             bigint generated always as identity primary key,
  variant_id     uuid not null references public.product_variants (id) on delete cascade,
  reason         public.inventory_reason not null,
  delta_on_hand  integer not null default 0,
  delta_reserved integer not null default 0,
  on_hand_after  integer not null,
  reserved_after integer not null,
  reference_type text,                                   -- 'order' | 'reservation' | 'return' | 'manual'
  reference_id   uuid,
  note           text,
  actor_id       uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  check (delta_on_hand <> 0 or delta_reserved <> 0)
);
create index inventory_movements_variant_idx   on public.inventory_movements (variant_id, created_at desc);
create index inventory_movements_reference_idx on public.inventory_movements (reference_type, reference_id);
create index inventory_movements_actor_idx     on public.inventory_movements (actor_id) where actor_id is not null;
create index inventory_movements_created_brin  on public.inventory_movements using brin (created_at);

-- ---------- Filter attributes (material, silhouette, fit, closure...) ----------
-- Size and colour live on variants; everything else is an attribute.
create table public.attributes (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique check (code ~ '^[a-z_]+$'),
  name          text not null,
  applies_to    text not null default 'all' check (applies_to in ('all', 'apparel', 'footwear')),
  is_filterable boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.attribute_values (
  id           uuid primary key default gen_random_uuid(),
  attribute_id uuid not null references public.attributes (id) on delete cascade,
  value        text not null,
  slug         text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  unique (attribute_id, slug)
);

create table public.product_attribute_values (
  product_id         uuid not null references public.products (id) on delete cascade,
  attribute_value_id uuid not null references public.attribute_values (id) on delete cascade,
  primary key (product_id, attribute_value_id)
);
create index product_attribute_values_value_idx on public.product_attribute_values (attribute_value_id, product_id);

-- ---------- Related products ----------
create table public.related_products (
  product_id         uuid not null references public.products (id) on delete cascade,
  related_product_id uuid not null references public.products (id) on delete cascade,
  relation_type      text not null default 'related' check (relation_type in ('related', 'complete_the_look', 'similar')),
  sort_order         integer not null default 0,
  created_at         timestamptz not null default now(),
  primary key (product_id, relation_type, related_product_id),
  check (product_id <> related_product_id)
);
create index related_products_related_idx on public.related_products (related_product_id);

-- ---------- Wishlist ----------
create table public.wishlist_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique nulls not distinct (user_id, product_id, variant_id)
);
create index wishlist_items_user_idx    on public.wishlist_items (user_id, created_at desc);
create index wishlist_items_product_idx on public.wishlist_items (product_id);
create index wishlist_items_variant_idx on public.wishlist_items (variant_id) where variant_id is not null;
