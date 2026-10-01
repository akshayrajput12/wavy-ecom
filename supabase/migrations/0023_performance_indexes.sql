-- =============================================================================
-- 0023 — Performance indexes for public storefront reads
--
-- Audit (docs/system-design/PERFORMANCE.md): FK columns, slug lookups, search (GIN tsvector +
-- pg_trgm on name/brand), reviews, redirects, home/content lists are already indexed in 0003-0012.
-- The gap: catalog/repo.ts sorts with nullsFirst:false, i.e. `DESC NULLS LAST`. A `DESC` index
-- (default NULLS FIRST) cannot serve that order, so every listing page sorted the whole published
-- set before LIMIT. These partial indexes match the ORDER BY of each listing sort exactly.
--
-- Plain CREATE INDEX (not CONCURRENTLY): migrations run in a transaction and the products table
-- is small. On a large live table, run each statement by hand as CREATE INDEX CONCURRENTLY.
-- =============================================================================

-- listProducts sort=featured (default PLP, /api/products, home carousels, spotlight "best sellers")
--   order is_featured.desc.nullslast, sort_order.asc.nullslast, published_at.desc.nullslast
create index if not exists products_pub_featured_sort_idx
  on public.products (is_featured desc nulls last, sort_order, published_at desc nulls last)
  where status = 'published';

-- listProducts sort=newest (spotlight "new arrivals", home "new" carousel)
create index if not exists products_pub_newest_idx
  on public.products (published_at desc nulls last)
  where status = 'published';

-- listProducts sort=price-desc (price-asc is served by products_published_price_idx)
create index if not exists products_pub_price_desc_idx
  on public.products (price_min desc nulls last)
  where status = 'published';

-- listProducts sort=rating (home "best_rated" carousel)
create index if not exists products_pub_rating_idx
  on public.products (rating_display desc nulls last, review_count_display desc nulls last)
  where status = 'published';

-- relatedIds() PDP top-up: eq(category_id) order is_featured.desc, review_count_display.desc
--   (search suggestions order by review_count_display too, but filter first through the trigram GIN)
create index if not exists products_pub_related_idx
  on public.products (category_id, is_featured desc nulls last, review_count_display desc nulls last)
  where status = 'published';

analyze public.products;
