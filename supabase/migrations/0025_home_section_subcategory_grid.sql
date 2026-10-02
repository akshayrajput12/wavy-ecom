-- =============================================================================
-- 0025 — Home section type: subcategory_grid
-- A grid of sub-category tiles (image, name, offer line, "Shop now"), shown under the category section.
-- config: {parentIds?: uuid[], categoryIds?: uuid[], limit?, columns?: 4 or 6, showOffer?}
-- (zod: HomeSectionConfig in src/backend/content/schema.ts; docs/database/SCHEMA.md).
-- ADD VALUE is not usable in the same transaction it is added in; seed.sql runs afterwards.
--
-- category_offer_stats: per category, the cheapest price and the deepest compare-at discount over its
-- published products' variants. One grouped scan feeds every tile's offer line (no per-tile query).
-- security_invoker = the caller's RLS applies, so anon only aggregates what it may already read
-- (published products, non-disabled variants: 0016_rls_policies.sql). The where clause repeats that
-- filter so staff (who can read drafts) get the same storefront numbers.
-- =============================================================================

alter type public.home_section_type add value if not exists 'subcategory_grid';

create or replace view public.category_offer_stats with (security_invoker = true) as
select p.category_id,
       min(v.price)::integer as price_min,
       coalesce(max(floor((v.compare_at_price - v.price) * 100.0 / v.compare_at_price))
                  filter (where v.compare_at_price > v.price), 0)::integer as max_discount_pct
from public.products p
join public.product_variants v on v.product_id = p.id
where p.status = 'published' and v.status <> 'disabled'
group by p.category_id;

comment on view public.category_offer_stats is
  'Storefront offer line per category: min variant price and max compare-at discount % (published, non-disabled). Paise.';

revoke all on public.category_offer_stats from public;
grant select on public.category_offer_stats to anon, authenticated, service_role;
