-- =============================================================================
-- 0024 — Store brand assets on store_settings
-- logo_url:      primary logo (header on paper, footer, checkout, admin shell)
-- logo_dark_url: light variant for dark stages (header over the hero, preloader)
-- favicon_url:   square icon (browser tab, apple touch icon, collapsed admin rail)
-- Public URLs from the content-media bucket (0017_storage.sql). Null = monogram + store name.
-- Writes fall under settings.write via store_settings_guard (not a tax/shipping column).
-- =============================================================================

alter table public.store_settings
  add column if not exists logo_url      text check (logo_url ~ '^https?://'),
  add column if not exists logo_dark_url text check (logo_dark_url ~ '^https?://'),
  add column if not exists favicon_url   text check (favicon_url ~ '^https?://');
