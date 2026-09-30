-- =============================================================================
-- 0003 — Catalog (multi-category store): categories, collections, products, media,
--        variants (Shopify-style options), inventory, filter attributes, related
--        products, wishlist
-- Storefront URLs: /products/<product slug>, /collections/<category or collection slug>.
-- Renamed slugs keep resolving through public.redirects (trigger in 0014).
-- =============================================================================

-- ---------- Categories (tree) ----------
create table public.categories (
  id              uuid primary key default gen_random_uuid(),
  parent_id       uuid references public.categories (id) on delete restrict,
  name            text not null check (char_length(name) between 1 and 80),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description     text,
  image_url       text,                                 -- tile / thumbnail
  image_alt       text,
  banner_url      text,                                 -- wide header on the category page
  banner_alt      text,
  sort_order      integer not null default 0,
  is_active       boolean not null default true,
  show_on_home    boolean not null default false,       -- picked up by home 'category_grid' when no ids are given
  seo_title       text check (char_length(seo_title) <= 70),
  seo_description text check (char_length(seo_description) <= 170),
  og_image_url    text,
  canonical_url   text,
  noindex         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (parent_id is null or parent_id <> id)
);
create index categories_parent_idx on public.categories (parent_id, sort_order);
create index categories_active_idx on public.categories (sort_order) where is_active;
create index categories_home_idx   on public.categories (sort_order) where is_active and show_on_home;

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

-- A category and all its descendants (PLP of a parent category lists its children's products).
create or replace function public.category_descendants(p_category_id uuid)
returns uuid[] language sql stable set search_path = '' as $$
  with recursive down as (
    select c.id, 1 as depth from public.categories c where c.id = p_category_id
    union all
    select c.id, down.depth + 1 from public.categories c join down on c.parent_id = down.id where down.depth < 10
  )
  select coalesce(array_agg(id), '{}') from down;
$$;

-- ---------- Collections (manual, merchandised) ----------
create table public.collections (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (char_length(name) between 1 and 80),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description     text,
  image_url       text,
  image_alt       text,
  banner_url      text,
  banner_alt      text,
  sort_order      integer not null default 0,
  is_active       boolean not null default true,
  show_on_home    boolean not null default false,       -- picked up by home 'collection_rail' when no ids are given
  starts_at       timestamptz,                          -- visible window (null = open-ended)
  ends_at         timestamptz,
  seo_title       text check (char_length(seo_title) <= 70),
  seo_description text check (char_length(seo_description) <= 170),
  og_image_url    text,
  canonical_url   text,
  noindex         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create index collections_active_idx on public.collections (sort_order) where is_active;
create index collections_home_idx   on public.collections (sort_order) where is_active and show_on_home;

-- ---------- Products ----------
create table public.products (
  id                    uuid primary key default gen_random_uuid(),
  category_id           uuid not null references public.categories (id) on delete restrict,
  name                  text not null check (char_length(name) between 1 and 140),
  slug                  text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  brand                 text check (char_length(brand) <= 80),
  short_description     text not null default '' check (char_length(short_description) <= 300),  -- line under the name
  description           text not null default '',              -- markdown
  highlights            text[] not null default '{}',          -- bullet points ("40h battery", "IPX5")
  -- [{"group":"Display","label":"Size","value":"6.5 in"}, ...]
  specifications        jsonb not null default '[]' check (jsonb_typeof(specifications) = 'array'),
  tags                  text[] not null default '{}',          -- search + filter ("wireless", "vegan")
  badges                text[] not null default '{}',          -- card ribbons ("New", "Bestseller")
  -- Shopify-style options: 0-3 names; each variant fills option1..N in the same order.
  option_names          text[] not null default '{}' check (cardinality(option_names) <= 3
                                                            and array_position(option_names, null) is null),
  size_chart            jsonb check (size_chart is null or jsonb_typeof(size_chart) = 'object'),  -- optional (apparel)
  -- shipping + compliance (variant weight overrides product weight)
  weight_grams          integer check (weight_grams > 0),
  length_mm             integer check (length_mm > 0),
  width_mm              integer check (width_mm > 0),
  height_mm             integer check (height_mm > 0),
  hsn_code              text check (hsn_code ~ '^[0-9]{4,8}$'), -- GST HSN
  country_of_origin     text not null default 'India',
  warranty              text,                                   -- "1 year manufacturer warranty"
  returnable            boolean not null default true,
  return_window_days    integer check (return_window_days between 0 and 90),   -- null = store default
  return_policy         text,                                   -- product-specific note shown on PDP
  -- merchandising
  status                public.product_status not null default 'draft',
  published_at          timestamptz,
  is_featured           boolean not null default false,
  sort_order            integer not null default 0,
  -- denormalised, maintained by triggers (0014)
  price_min             integer check (price_min >= 0),
  price_max             integer check (price_max >= 0),
  compare_at_min        integer check (compare_at_min >= 0),
  rating_avg            numeric(3,2) not null default 0 check (rating_avg between 0 and 5),
  review_count          integer not null default 0 check (review_count >= 0),
  -- admin marketing overrides: when set, the storefront shows these instead of the roll-up
  rating_override       numeric(2,1) check (rating_override between 0 and 5),
  review_count_override integer check (review_count_override >= 0),
  rating_display        numeric(3,2) generated always as (coalesce(rating_override, rating_avg)) stored,
  review_count_display  integer generated always as (coalesce(review_count_override, review_count)) stored,
  -- SEO
  seo_title             text check (char_length(seo_title) <= 70),
  seo_description       text check (char_length(seo_description) <= 170),
  og_image_url          text,
  canonical_url         text,
  noindex               boolean not null default false,
  created_by            uuid references public.profiles (id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  search_vector         tsvector generated always as (
      setweight(to_tsvector('english'::regconfig, coalesce(name, '')), 'A')
   || setweight(to_tsvector('english'::regconfig, coalesce(brand, '') || ' ' || public.immutable_array_to_string(tags)), 'B')
   || setweight(to_tsvector('english'::regconfig, coalesce(short_description, '') || ' '
                                                  || public.immutable_array_to_string(highlights)), 'C')
   || setweight(to_tsvector('english'::regconfig, coalesce(description, '')), 'D')
  ) stored
);
comment on column public.products.search_vector is 'FTS document; query with websearch_to_tsquery(''english'', q).';
comment on column public.products.rating_display is 'What the storefront shows: rating_override when set, else the approved-review average.';
-- search
create index products_search_idx     on public.products using gin (search_vector);
create index products_name_trgm_idx  on public.products using gin (name extensions.gin_trgm_ops);
create index products_brand_trgm_idx on public.products using gin (brand extensions.gin_trgm_ops) where brand is not null;
create index products_tags_trgm_idx  on public.products using gin (public.immutable_array_to_string(tags) extensions.gin_trgm_ops);
create index products_tags_idx       on public.products using gin (tags);                  -- tags @> '{wireless}'
-- storefront listings (published only)
create index products_published_new_idx      on public.products (published_at desc) where status = 'published';
create index products_published_created_idx  on public.products (created_at desc) where status = 'published';
create index products_published_cat_idx      on public.products (category_id, sort_order, published_at desc) where status = 'published';
create index products_published_price_idx    on public.products (price_min) where status = 'published';
create index products_published_rating_idx   on public.products (rating_display desc, review_count_display desc) where status = 'published';
create index products_published_featured_idx on public.products (sort_order, published_at desc) where status = 'published' and is_featured;
create index products_published_brand_idx    on public.products (lower(brand)) where status = 'published' and brand is not null;
-- admin
create index products_status_idx     on public.products (status, updated_at desc);
create index products_category_idx   on public.products (category_id);
create index products_created_by_idx on public.products (created_by);

-- ---------- Collection membership (manual ordering) ----------
-- Deleting a collection deletes its membership rows; products survive.
create table public.collection_products (
  collection_id uuid not null references public.collections (id) on delete cascade,
  product_id    uuid not null references public.products (id) on delete cascade,
  position      integer not null default 0,
  created_at    timestamptz not null default now(),
  primary key (collection_id, product_id)
);
create index collection_products_product_idx on public.collection_products (product_id);
create index collection_products_order_idx   on public.collection_products (collection_id, position);

-- ---------- Variants ----------
-- One row per sellable option combination. A product with no options has exactly one variant
-- (option1..3 null, title 'Default'). title is derived from the options by trigger (0014).
create table public.product_variants (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid not null references public.products (id) on delete cascade,
  sku                 text not null unique check (sku ~ '^[A-Z0-9][A-Z0-9-]{2,63}$'),
  barcode             text unique check (char_length(barcode) between 6 and 64),   -- EAN/UPC/ISBN
  option1             text check (char_length(option1) between 1 and 60),
  option2             text check (char_length(option2) between 1 and 60),
  option3             text check (char_length(option3) between 1 and 60),
  title               text not null default 'Default',           -- 'Black / M', '256 GB / Blue', '500 g'
  color_hex           text check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),  -- swatch for the colour option, if any
  price               integer not null check (price > 0),
  compare_at_price    integer,
  cost_price          integer check (cost_price >= 0),            -- margin reports; never sent to storefront
  weight_grams        integer check (weight_grams > 0),           -- null = product weight
  low_stock_threshold integer check (low_stock_threshold >= 0),   -- null = store_settings.low_stock_default
  status              public.variant_status not null default 'active',
  position            integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique nulls not distinct (product_id, option1, option2, option3),
  check (option2 is null or option1 is not null),
  check (option3 is null or option2 is not null),
  check (compare_at_price is null or compare_at_price > price)
);
create index product_variants_product_idx  on public.product_variants (product_id, position);
create index product_variants_sku_trgm_idx on public.product_variants using gin (sku extensions.gin_trgm_ops);
create index product_variants_price_idx    on public.product_variants (price) where status = 'active';

-- ---------- Media ----------
create table public.product_media (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  variant_id   uuid references public.product_variants (id) on delete set null,   -- image of one exact variant
  option_value text,                                     -- or of every variant with this option value ('Black')
  media_type   text not null default 'image' check (media_type in ('image', 'video')),
  url          text not null,
  storage_path text,                                     -- product-media bucket path when self-hosted
  alt          text not null default '',
  width        integer check (width > 0),
  height       integer check (height > 0),
  position     integer not null default 0,
  is_primary   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index product_media_product_idx on public.product_media (product_id, position);
create index product_media_variant_idx on public.product_media (variant_id) where variant_id is not null;
create unique index product_media_one_primary_uidx on public.product_media (product_id) where is_primary;

-- ---------- Inventory (one row per variant, created by trigger) ----------
-- available = on_hand - reserved. Both CHECKs make negative stock impossible even if a
-- function has a bug; every RPC also locks the row FOR UPDATE before changing it.
create table public.inventory (
  variant_id uuid primary key references public.product_variants (id) on delete cascade,
  on_hand    integer not null default 0 check (on_hand >= 0),
  reserved   integer not null default 0 check (reserved >= 0),
  available  integer generated always as (on_hand - reserved) stored,
  updated_at timestamptz not null default now(),
  constraint inventory_no_oversell check (on_hand - reserved >= 0)
);
create index inventory_available_idx on public.inventory (available);   -- low-stock / sold-out admin lists

-- Holds while a customer pays (released on cancel/expiry, consumed on capture / COD confirm).
create table public.inventory_reservations (
  id                  uuid primary key default gen_random_uuid(),
  variant_id          uuid not null references public.product_variants (id) on delete cascade,
  quantity            integer not null check (quantity > 0),
  status              public.reservation_status not null default 'active',
  order_id            uuid,                              -- FK added in 0005
  checkout_session_id uuid,                              -- FK added in 0004
  expires_at          timestamptz,                       -- null = held until committed/cancelled (COD)
  released_at         timestamptz,
  consumed_at         timestamptz,
  created_at          timestamptz not null default now()
);
create index inventory_reservations_order_idx    on public.inventory_reservations (order_id);
create index inventory_reservations_variant_idx  on public.inventory_reservations (variant_id) where status = 'active';
create index inventory_reservations_expiry_idx   on public.inventory_reservations (expires_at) where status = 'active';
create index inventory_reservations_checkout_idx on public.inventory_reservations (checkout_session_id) where checkout_session_id is not null;

-- Append-only stock ledger: every change to on_hand or reserved writes one row.
create table public.inventory_movements (
  id             bigint generated always as identity primary key,
  variant_id     uuid not null references public.product_variants (id) on delete cascade,
  reason         public.inventory_reason not null,
  delta_on_hand  integer not null default 0,
  delta_reserved integer not null default 0,
  on_hand_after  integer not null,
  reserved_after integer not null,
  reference_type text check (reference_type in ('order', 'reservation', 'return', 'manual', 'import')),
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

-- ---------- Filter attributes (material, connectivity, skin type...) ----------
-- Variant options live on variants; everything else filterable is an attribute.
create table public.attributes (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique check (code ~ '^[a-z_]+$'),
  name          text not null,
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
  relation_type      text not null default 'related'
                     check (relation_type in ('related', 'similar', 'frequently_bought_together', 'accessory')),
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
