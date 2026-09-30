-- =============================================================================
-- 0012 — Home page sections (admin-editable)
-- The storefront home page renders active rows in sort_order. Each row's config jsonb has
-- a per-type shape (validated with zod in src/backend/content; documented in
-- docs/database/SCHEMA.md). Ids inside config are plain uuids: a deleted product/category/
-- collection is simply skipped at render time.
-- =============================================================================

create table public.home_sections (
  id         uuid primary key default gen_random_uuid(),
  type       public.home_section_type not null,
  title      text check (char_length(title) <= 120),
  subtitle   text check (char_length(subtitle) <= 300),
  config     jsonb not null default '{}' check (jsonb_typeof(config) = 'object'),
  sort_order integer not null default 0,
  is_active  boolean not null default true,
  starts_at  timestamptz,                       -- visible window (null = open-ended)
  ends_at    timestamptz,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);
comment on table public.home_sections is 'Admin-editable home page blocks; public read = active and inside its window.';
create index home_sections_active_idx on public.home_sections (sort_order) where is_active;
create index home_sections_updated_by_idx on public.home_sections (updated_by);
