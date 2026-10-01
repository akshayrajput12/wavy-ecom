# Performance

Audit of the public read path (home, PLP, PDP, search, typeahead, settings, nav) and what changed.
Capacity targets and SLOs live in [02_CAPACITY_AND_SCALING.md](02_CAPACITY_AND_SCALING.md).

## 1. What was already right (kept)

- Every public read goes through `cached()` (`backend/_core/cache.ts`: `unstable_cache` + React `cache`,
  tagged, 300 s). Home, PDP, listing, facets, suggestions, settings, nav, reviews and shipping methods are all cached.
  Admin writes call `revalidateTag(TAGS.x, "max")`.
- Public reads use the anon `publicClient()` singleton (RLS = anon). The service role is used only for checkout,
  payments and webhooks. The request client is per request, and `getSession()` is React-cached.
- Explicit column lists everywhere (`catalog/mapper.ts`). No N+1: home batches product ids into one `in()`, and
  embeds load variants, media and inventory in one PostgREST call.
- Page sizes are bounded in zod (`pageSize` ≤ 60, `page` ≤ 500, reviews ≤ 50).
- Indexes: every FK column, slug lookup and RLS predicate is indexed. Search has a GIN `tsvector` and `pg_trgm`
  on name and brand.
- `getClaims()` verifies the JWT locally (no auth round trip for asymmetric keys).

## 2. Changes

| Change | Why | Effect |
|---|---|---|
| `0023_performance_indexes.sql`: 5 partial indexes `… DESC NULLS LAST … WHERE status='published'` | `listProducts` orders with `nullsFirst:false` (`DESC NULLS LAST`). The 0003 indexes are `DESC` (NULLS FIRST), so Postgres can't use them for ordered scans. Every featured, newest, price-desc and rating listing, plus the PDP "related" query, sorted the whole published set before `LIMIT`. | EXPLAIN on 50k synthetic products (pglite): Seq Scan + Sort 64–88 ms → Index Scan 0.2–0.5 ms, 715 → 3–26 buffers. price-asc already matched and is unchanged. |
| `listProducts` count `exact` → `estimated` | Exact `count(*)` on every listing is a second full pass. "estimated" is exact below PostgREST max-rows (1000) and a planner estimate above it. | No change for today's catalog; bounded cost at scale. |
| `route()`: per-IP fixed-window rate limit (`backend/_core/rateLimit.ts`, table keyed `"<METHOD> <svc>"`) | No abuse protection on checkout, coupon brute force, review spam, tracking-token guessing, or Shiprocket-backed serviceability. | 429 `rate_limited` + `retry-after`. Covered by `rateLimit.test.ts`. |
| `route()` defaults `cache-control: private, no-store`; `fail()` always no-store | API JSON had no `Cache-Control`, so cart, account and quote responses relied on CDN defaults. | Personalised routes can never be shared-cached. |
| `PUBLIC_CACHE` (`public, s-maxage=60, stale-while-revalidate=300`) on `GET /api/products`, `/api/search/suggest` (+ browser `max-age=60`), `/api/shipping/methods`, `/api/reviews` | Public JSON can be served by the CDN instead of the origin. | Origin load for these drops to about 1 req/min per URL per PoP behind a CDN. |
| `proxy.ts` matcher skips `api/products`, `api/search/suggest`, `api/shipping/methods` | These need no session. Skipping avoids `getClaims` per call, and a refreshed `Set-Cookie` can never land on a CDN-cached response. | One less auth step per typeahead keystroke. |
| `next.config.ts`: `poweredByHeader:false`, `compress:true` (explicit), images `avif`+`webp`, `deviceSizes` 8→5, `imageSizes` 7→5, `minimumCacheTTL` 31 d, env-derived Supabase host | Defaults emit 15-candidate srcsets (incl. 2048/3840) and re-optimise every 4 h. Uploads are UUID paths, so a long TTL is safe. | Smaller HTML (srcset), smaller images (AVIF), fewer optimiser runs. |
| `RatingStars`: 1 SVG with `<use>` instead of 10 lucide SVGs per rating | ProductCard is a Server Component, so every star is in both the HTML and the RSC payload. Home rendered 330 star SVGs (~190 KB raw). | See §3. |
| `QuickViewHost` lazy-loads `QuickViewPanel` (Dialog + Gallery + BuyBox) via `next/dynamic`, prefetched on hover/focus | It is mounted in the store layout, so every store page shipped the quick-view JS even if never opened. | That code leaves the initial bundle of home, PLP and search. |

Not done, on purpose:
- **`next/dynamic` for TearReveal and Mosaic.** They are rendered from Server Components. The Next 16 docs
  (`02-guides/lazy-loading.md`) say code splitting does not apply to dynamic imports from Server Components, and
  client references already load only when rendered.
- **Migrating `unstable_cache` to `"use cache"` + `cacheComponents`.** Next 16 recommends it, but it changes
  rendering for every route. `unstable_cache` is still supported. Do it as its own change.

## 3. Measurements

Production builds (`next build --webpack` + `next start`) of the same tree with and without these changes,
served side by side on one Windows laptop against the remote Supabase project, with a warm data cache.
Timings are 20 interleaved rounds (before, after, before, …). They are indicative: the box is noisy and the data
is cached, so DB time barely shows.

| Route | HTML before → after (raw / gzip) | Median before → after | p90 before → after |
|---|---|---|---|
| `/` | 955 KB / 62.8 KB → **676 KB / 58.5 KB** (−29% raw) | 91 → 77 ms | 156 → 133 ms |
| `/collections/smartphones` | 142 KB → 133 KB | 25 → 29 ms (noise) | 43 → 50 ms |
| `/products/[slug]` | 260 KB / 32.5 KB → **213 KB / 31.9 KB** (−18%) | 43 → 37 ms | 90 → 69 ms |
| `/search?q=a` | 683 KB / 44.8 KB → **503 KB / 43.6 KB** (−26%) | 75 → 62 ms | 111 → 97 ms |
| `/api/search/suggest?q=nov` | — | 8 → 6 ms | 13 → 11 ms |

- First-load JS (gzip): 306 → 304 KB on home, PLP and search (QuickView chunk out). PDP is unchanged at about 312 KB
  because Gallery and BuyBox are needed there. About 305 KB gzip of JS on every page is the next client-side target.
- SVG elements on the PDP: 131 → 68. On home, 330 star SVGs become 33.
- DB: see the 0023 row in §2 (EXPLAIN, 50k synthetic rows). With the current small seed and a warm data cache the
  index win does not show in page timings. It shows on cache misses (every 300 s per key, every admin
  `revalidateTag`, and every uncached search term) as the catalog grows.
- Headers before → after: `/api/products` had no `Cache-Control` and `X-Powered-By: Next.js`. It now sends
  `public, s-maxage=60, stale-while-revalidate=300` and no `X-Powered-By`. `/api/orders/track` now sends `private, no-store`, and the 31st call in 60 s gets
  `429` with `retry-after`.
- Dev server (`next dev`, before only): `/` 3.3 s, `/search?q=a` 3.2 s, PLP/PDP 0.7 s, API 40–50 ms. Dev render time
  tracks HTML size, which is why the home page was the slowest.

## 4. Biggest remaining lever: storefront HTML is never cacheable

`Header` calls `getSession()` (cookies) for the staff link, so **every storefront page is dynamic**
(`Cache-Control: private, no-store`). Every page view is a full RSC render at the origin. Data comes from the
data cache, but the render does not. To fix it:
1. Move the session-dependent bit (the staff link) into a small client island that fetches `/api/account/profile`.
2. Then home and PDP become ISR (`revalidate = 300`, tag revalidation already wired) and the CDN serves the HTML.
   PLP and search stay dynamic only when they have query params.
   This was not done here because the Header is being changed in parallel (store logo work).

Also: ProductCard passes the full `Product` (all variants and media) to `QuickViewButton`, so every card serialises
its whole product into the RSC payload. Passing a slug and fetching on open would cut the home payload further.

## 5. Scaling path

1. **CDN for HTML** (§4), then a cache hit ratio ≥ 75% (the 02 sizing assumes it).
2. **Shared rate limit.** The limiter is per instance (`ponytail:` note in `rateLimit.ts`). Move the same keys to
   Upstash Redis (`INCR` + `EXPIRE`) or the UNLOGGED `rate_limits` table + `rate_hit()`, and keep Vercel Firewall
   rules for coarse per-IP limits. Storefront pages (e.g. `/search?q=<random>`, which busts the data cache) are
   only protected at the edge.
3. **Shared data cache.** `unstable_cache` is per instance on self-hosting. Use a `cacheHandler` (Redis), or Vercel's
   shared data cache, so N instances don't do N cold reads.
4. **Read replica** for `/search`, facets and admin analytics (`lib/supabase/replica.ts`); writes and checkout stay
   on the primary.
5. **Supavisor transaction pooling** (port 6543) for any direct `postgres` driver use (cron, workers). supabase-js
   goes through PostgREST and opens no DB sockets.
6. **Queue** webhooks and emails (Supabase Queues / pg_cron outbox worker) so provider spikes don't hold request
   time.
7. **Facets in SQL.** Facets are computed in JS over ≤ 1000 in-scope products (`ponytail:` in `catalog/repo.ts`).
   Move them to an RPC with `GROUP BY` once categories pass about 1000 products.
