-- =============================================================================
-- 0008 — Coupons, offers (bundle / BOGO / tiered), campaigns, testimonials
-- Pricing logic lives in compute_pricing() (0014); these tables are its rules.
-- =============================================================================

create table public.coupons (
  id                     uuid primary key default gen_random_uuid(),
  code                   text not null check (code ~ '^[A-Za-z0-9_-]{3,32}$'),
  description            text,
  type                   public.coupon_type not null,
  value                  integer not null default 0,   -- percent: 1..100 ; fixed: paise ; free_shipping: 0
  min_order_amount       integer not null default 0 check (min_order_amount >= 0),
  max_discount_amount    integer check (max_discount_amount > 0),
  usage_limit_total      integer check (usage_limit_total > 0),
  usage_limit_per_user   integer check (usage_limit_per_user > 0),
  usage_count            integer not null default 0 check (usage_count >= 0),   -- captured redemptions
  first_order_only       boolean not null default false,
  combinable_with_offers boolean not null default true,
  starts_at              timestamptz,
  ends_at                timestamptz,
  status                 public.coupon_status not null default 'draft',
  created_by             uuid references public.profiles (id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at),
  check (case type when 'percent' then value between 1 and 100
                   when 'fixed' then value > 0
                   else value = 0 end)
);
create unique index coupons_code_uidx on public.coupons (upper(code));
create index coupons_active_code_idx on public.coupons (upper(code)) where status = 'active';   -- checkout lookup
create index coupons_status_idx on public.coupons (status, created_at desc);
create index coupons_code_trgm_idx on public.coupons using gin (code extensions.gin_trgm_ops);
create index coupons_created_by_idx on public.coupons (created_by);

create table public.offers (
  id                        uuid primary key default gen_random_uuid(),
  name                      text not null,
  slug                      text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description               text,
  type                      public.offer_type not null,
  status                    public.coupon_status not null default 'draft',
  priority                  integer not null default 0,        -- higher first; a unit gets at most one offer
  -- bundle_fixed_price: any <required_qty> eligible items for <bundle_price>
  required_qty              integer check (required_qty >= 2),
  bundle_price              integer check (bundle_price > 0),
  -- bogo: buy <buy_qty> get <get_qty> at <get_discount_percent>% off (100 = free); cheapest units discounted
  buy_qty                   integer check (buy_qty >= 1),
  get_qty                   integer check (get_qty >= 1),
  get_discount_percent      integer check (get_discount_percent between 1 and 100),
  -- tiered_percent: [{"min_qty":2,"percent":10},{"min_qty":4,"percent":20}]
  tiers                     jsonb check (tiers is null or jsonb_typeof(tiers) = 'array'),
  max_applications_per_order integer check (max_applications_per_order > 0),
  usage_limit_total         integer check (usage_limit_total > 0),
  usage_count               integer not null default 0,
  starts_at                 timestamptz,
  ends_at                   timestamptz,
  badge_text                text,                               -- "3 for Rs 999" on product cards
  nudge_template            text,                               -- "Add {n} more to get 3 for Rs 999"
  created_by                uuid references public.profiles (id) on delete set null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at),
  check (case type
           when 'bundle_fixed_price' then required_qty is not null and bundle_price is not null
           when 'bogo' then buy_qty is not null and get_qty is not null and get_discount_percent is not null
           when 'tiered_percent' then tiers is not null and jsonb_array_length(tiers) > 0
         end)
);
create index offers_active_idx on public.offers (priority desc) where status = 'active';
create index offers_status_idx on public.offers (status, created_at desc);
create index offers_created_by_idx on public.offers (created_by);

-- Include/exclude rules shared by coupons and offers (discount_target_match, 0015):
--   no include rows  -> every item is eligible
--   include rows     -> item must match at least one
--   exclude rows     -> item matching any is never eligible (exclude beats include)
-- A row targets exactly one of: product, variant, category (matches descendants), collection.
create table public.discount_targets (
  id            uuid primary key default gen_random_uuid(),
  coupon_id     uuid references public.coupons (id) on delete cascade,
  offer_id      uuid references public.offers (id) on delete cascade,
  mode          public.target_mode not null default 'include',
  product_id    uuid references public.products (id) on delete cascade,
  variant_id    uuid references public.product_variants (id) on delete cascade,
  category_id   uuid references public.categories (id) on delete cascade,   -- matches descendants too
  collection_id uuid references public.collections (id) on delete cascade,
  created_at    timestamptz not null default now(),
  check (num_nonnulls(coupon_id, offer_id) = 1),
  check (num_nonnulls(product_id, variant_id, category_id, collection_id) = 1),
  unique nulls not distinct (coupon_id, offer_id, mode, product_id, variant_id, category_id, collection_id)
);
create index discount_targets_coupon_idx     on public.discount_targets (coupon_id) where coupon_id is not null;
create index discount_targets_offer_idx      on public.discount_targets (offer_id) where offer_id is not null;
create index discount_targets_product_idx    on public.discount_targets (product_id) where product_id is not null;
create index discount_targets_variant_idx    on public.discount_targets (variant_id) where variant_id is not null;
create index discount_targets_category_idx   on public.discount_targets (category_id) where category_id is not null;
create index discount_targets_collection_idx on public.discount_targets (collection_id) where collection_id is not null;

create table public.coupon_redemptions (
  id              uuid primary key default gen_random_uuid(),
  coupon_id       uuid not null references public.coupons (id) on delete restrict,
  order_id        uuid not null unique references public.orders (id) on delete cascade,   -- one coupon per order
  user_id         uuid references public.profiles (id) on delete set null,
  email           text not null,
  discount_amount integer not null check (discount_amount >= 0),
  status          public.redemption_status not null default 'reserved',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index coupon_redemptions_coupon_idx on public.coupon_redemptions (coupon_id, status);
create index coupon_redemptions_user_idx   on public.coupon_redemptions (coupon_id, user_id) where status <> 'reversed';
create index coupon_redemptions_email_idx  on public.coupon_redemptions (coupon_id, lower(email)) where status <> 'reversed';
create index coupon_redemptions_user_fk_idx on public.coupon_redemptions (user_id);

create table public.offer_redemptions (
  id              uuid primary key default gen_random_uuid(),
  offer_id        uuid not null references public.offers (id) on delete restrict,
  order_id        uuid not null references public.orders (id) on delete cascade,
  applications    integer not null default 1 check (applications > 0),
  discount_amount integer not null check (discount_amount >= 0),
  status          public.redemption_status not null default 'reserved',
  created_at      timestamptz not null default now(),
  unique (offer_id, order_id)
);
create index offer_redemptions_order_idx on public.offer_redemptions (order_id);

alter table public.orders add constraint orders_coupon_fk
  foreign key (coupon_id) references public.coupons (id) on delete set null;

-- ---------- Campaigns ----------
create table public.campaigns (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status          public.campaign_status not null default 'draft',
  channel         text not null default 'site'
                  check (channel in ('site', 'email', 'instagram', 'whatsapp', 'sms', 'paid_social', 'google', 'influencer')),
  description     text,
  hero_image_url  text,
  hero_image_alt  text,
  content         jsonb not null default '{}',     -- banner copy, CTA, blocks
  utm_campaign    text unique,
  coupon_id       uuid references public.coupons (id) on delete set null,
  offer_id        uuid references public.offers (id) on delete set null,
  budget_paise    integer check (budget_paise >= 0),
  metrics         jsonb not null default '{}',     -- {impressions, clicks, orders, revenue} rolled up by job
  starts_at       timestamptz,
  ends_at         timestamptz,
  seo_title       text,
  seo_description text,
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create index campaigns_status_idx on public.campaigns (status, starts_at desc);
create index campaigns_live_idx   on public.campaigns (starts_at) where status = 'live';
create index campaigns_coupon_idx on public.campaigns (coupon_id) where coupon_id is not null;
create index campaigns_offer_idx  on public.campaigns (offer_id) where offer_id is not null;
create index campaigns_created_by_idx on public.campaigns (created_by);

create table public.campaign_products (
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  sort_order  integer not null default 0,
  primary key (campaign_id, product_id)
);
create index campaign_products_product_idx on public.campaign_products (product_id);

create table public.campaign_collections (
  campaign_id   uuid not null references public.campaigns (id) on delete cascade,
  collection_id uuid not null references public.collections (id) on delete cascade,
  sort_order    integer not null default 0,
  primary key (campaign_id, collection_id)
);
create index campaign_collections_collection_idx on public.campaign_collections (collection_id);

create table public.testimonials (
  id           uuid primary key default gen_random_uuid(),
  author_name  text not null,
  author_role  text,                            -- "Mumbai", "Verified buyer"
  quote        text not null check (char_length(quote) <= 600),
  avatar_url   text,
  rating       smallint check (rating between 1 and 5),
  product_id   uuid references public.products (id) on delete set null,
  is_published boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index testimonials_published_idx on public.testimonials (sort_order) where is_published;
create index testimonials_product_idx on public.testimonials (product_id) where product_id is not null;
