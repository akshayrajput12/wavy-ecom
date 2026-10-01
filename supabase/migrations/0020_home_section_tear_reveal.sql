-- =============================================================================
-- 0020 — Home section type: tear_reveal
-- A scroll-driven "poster tears in two" block (src/components/ui/TearReveal.tsx).
-- config: {word, tagline?, variant?: 'tiger' or 'image', image?, imageAlt?, cta?: {label, href}}
-- (zod: HomeSectionConfig in src/backend/content/schema.ts; docs/database/SCHEMA.md).
-- ADD VALUE is not usable in the same transaction it is added in; seed.sql runs afterwards.
-- =============================================================================

alter type public.home_section_type add value if not exists 'tear_reveal';
