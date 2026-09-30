-- =============================================================================
-- 0009 — Content pages, FAQ, lookbook, blog, SEO overrides, redirects
-- =============================================================================

create table public.content_pages (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  page_type       text not null check (page_type in ('about', 'faq', 'lookbook', 'policy', 'landing', 'custom')),
  title           text not null,
  blocks          jsonb not null default '[]' check (jsonb_typeof(blocks) = 'array'),  -- [{type:'hero'|'text'|'image'|..., ...}]
  status          public.content_status not null default 'draft',
  published_at    timestamptz,
  seo_title       text,
  seo_description text,
  og_image_url    text,
  canonical_url   text,
  noindex         boolean not null default false,
  updated_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index content_pages_type_idx on public.content_pages (page_type) where status = 'published';
create index content_pages_updated_by_idx on public.content_pages (updated_by);

create table public.faqs (
  id           uuid primary key default gen_random_uuid(),
  category     text not null default 'general'
               check (category in ('general', 'orders', 'shipping', 'returns', 'payments', 'sizing', 'try_on', 'account')),
  question     text not null,
  answer       text not null,
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index faqs_published_idx on public.faqs (category, sort_order) where is_published;

create table public.lookbook_entries (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  season       text,                             -- "SS26"
  description  text,
  image_url    text not null,
  image_alt    text not null default '',
  sort_order   integer not null default 0,
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index lookbook_entries_published_idx on public.lookbook_entries (sort_order) where is_published;

-- "Shop the look" hotspots.
create table public.lookbook_entry_products (
  entry_id   uuid not null references public.lookbook_entries (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  hotspot_x  numeric(5,2) check (hotspot_x between 0 and 100),
  hotspot_y  numeric(5,2) check (hotspot_y between 0 and 100),
  primary key (entry_id, product_id)
);
create index lookbook_entry_products_product_idx on public.lookbook_entry_products (product_id);

-- ---------- Blog ----------
create table public.blog_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);

create table public.blog_tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);

create table public.blog_posts (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title           text not null check (char_length(title) between 1 and 160),
  excerpt         text not null default '',
  cover_url       text,
  cover_alt       text not null default '',
  body            text not null default '',       -- markdown
  status          public.blog_status not null default 'draft',
  scheduled_for   timestamptz,
  published_at    timestamptz,
  author_id       uuid references public.profiles (id) on delete set null,
  author_name     text not null,
  category_id     uuid references public.blog_categories (id) on delete set null,
  reading_minutes integer check (reading_minutes > 0),
  seo_title       text check (char_length(seo_title) <= 70),
  seo_description text check (char_length(seo_description) <= 170),
  og_image_url    text,
  canonical_url   text,
  noindex         boolean not null default false,
  json_ld         jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  search_vector   tsvector generated always as (
      setweight(to_tsvector('english'::regconfig, coalesce(title, '')), 'A')
   || setweight(to_tsvector('english'::regconfig, coalesce(excerpt, '')), 'B')
   || setweight(to_tsvector('english'::regconfig, coalesce(body, '')), 'D')
  ) stored,
  check (status <> 'scheduled' or scheduled_for is not null)
);
create index blog_posts_published_idx on public.blog_posts (published_at desc) where status = 'published';
create index blog_posts_scheduled_idx on public.blog_posts (scheduled_for) where status = 'scheduled';   -- publisher job
create index blog_posts_status_idx    on public.blog_posts (status, updated_at desc);
create index blog_posts_category_idx  on public.blog_posts (category_id, published_at desc);
create index blog_posts_author_idx    on public.blog_posts (author_id);
create index blog_posts_search_idx    on public.blog_posts using gin (search_vector);

create table public.blog_post_tags (
  post_id uuid not null references public.blog_posts (id) on delete cascade,
  tag_id  uuid not null references public.blog_tags (id) on delete cascade,
  primary key (post_id, tag_id)
);
create index blog_post_tags_tag_idx on public.blog_post_tags (tag_id);

-- ---------- SEO ----------
-- Per-route overrides for any path (static pages, PLPs, filtered URLs...). Exact path match.
create table public.seo_overrides (
  id             uuid primary key default gen_random_uuid(),
  path           text not null unique check (path ~ '^/'),
  title          text check (char_length(title) <= 70),
  description    text check (char_length(description) <= 170),
  og_title       text,
  og_description text,
  og_image_url   text,
  canonical_url  text,
  noindex        boolean not null default false,
  nofollow       boolean not null default false,
  json_ld        jsonb,
  updated_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index seo_overrides_updated_by_idx on public.seo_overrides (updated_by);

create table public.redirects (
  id          uuid primary key default gen_random_uuid(),
  from_path   text not null unique check (from_path ~ '^/'),
  to_path     text not null check (to_path ~ '^(/|https?://)'),
  status_code smallint not null default 301 check (status_code in (301, 302, 307, 308)),
  is_active   boolean not null default true,
  hit_count   bigint not null default 0,
  last_hit_at timestamptz,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (from_path <> to_path)
);
create index redirects_active_idx on public.redirects (from_path) include (to_path, status_code) where is_active;
create index redirects_created_by_idx on public.redirects (created_by);
