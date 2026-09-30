# 02 · Capacity and Scaling

All numbers are planning estimates. Re-baseline them with real PostHog and Vercel data 30 days
after launch.

## 1. Traffic assumptions

| Metric | Launch (M0) | Growth (M12) | Scale (M24) |
|---|---|---|---|
| Monthly unique visitors | 50,000 | 300,000 | 1,000,000 |
| Sessions / visitor | 1.3 | 1.4 | 1.4 |
| Pages / session | 5 | 5 | 5 |
| Page views / month | 325k | 2.1M | 7.0M |
| API calls / page view (cart, analytics beacon, stock, search) | 2 | 2 | 2 |
| Conversion (orders / session) | 1.5% | 2.0% | 2.2% |
| Orders / month | ~975 | ~8,400 | ~30,800 |
| Average order value | ₹2,400 | ₹2,600 | ₹2,800 |
| GMV / month | ₹23 L | ₹2.2 Cr | ₹8.6 Cr |
| Payment attempts / order (retries, method switches) | 1.35 | 1.3 | 1.3 |
| Share of traffic in 18:00–23:00 IST | 45% | 45% | 45% |

## 2. Load profile

- **Normal peak** is the busiest hour of the day, about 12% of daily traffic. Average session length is 8 min.
- A **sale day** brings 5× normal-day sessions. The first 15 minutes after the email and Instagram push take 15% of that day, and conversion in that window is 4%.

| | Launch normal peak | Launch sale peak | Scale normal peak | Scale sale peak |
|---|---|---|---|---|
| Sessions in window | 260 / h | 1,600 / 15 min | 5,600 / h | 35,000 / 15 min |
| Concurrent users | 35 | 900 | 750 | 18,000 |
| Page views / s (edge) | 0.4 | 9 | 8 | 195 |
| Page renders at origin / s (25% CDN miss) | 0.1 | 2.3 | 2 | 50 |
| API RPS (`/api/**`, never cached) | 0.8 | 18 | 16 | 390 |
| `POST /api/checkout` / min | 0.1 | 6 | 2.7 | 125 |
| Orders confirmed / min | 0.05 | 4.3 | 2 | 93 |
| Payment attempts / min | 0.07 | 5.6 | 2.7 | 120 |
| Webhooks in / min (Razorpay + PayU + Shiprocket) | 0.3 | 15 | 8 | 300 |
| Emails / min (outbox) | 0.1 | 5 | 4 | 190 |

Design target: **2× the Scale sale peak**, which is 800 API RPS and 200 orders/min. Beyond that the
system degrades gracefully: the drop waiting room (§4) turns on and catalog pages are served
stale from the CDN.

## 3. Database sizing and connections

`supabase-js` talks to **PostgREST over HTTP**, not raw Postgres connections. Vercel functions
therefore do not open DB sockets. Connection pressure lands on the PostgREST pool and on
Supavisor, which is used by `pg_net` callbacks, migrations and any direct `postgres` driver in
cron routes.

| Compute tier | vCPU / RAM | Direct conns | Supavisor pooler clients | Fits |
|---|---|---|---|---|
| Micro (Pro default) | 2 shared / 1 GB | 60 | 200 | Launch, ≤ 30 API RPS sustained |
| Small | 2 shared / 2 GB | 90 | 400 | Launch sale peak |
| Medium | 2 shared / 4 GB | 120 | 600 | Growth; Scale normal |
| Large | 2 dedicated / 8 GB | 160 | 800 | Scale sale peak (with cache hit ≥ 75%) |
| XL + 1 read replica | 4 dedicated / 16 GB | 240 | 1,000 | 2× Scale sale peak |

Rules:
- Direct `postgres` connections (cron workers only) use Supavisor **transaction mode**, port `6543`, and cap the pool at 5 per function.
- Keep every transaction under 50 ms. `place_order()` and `confirm_payment()` are single SQL functions with no provider calls inside.
- **Read replica** (Supabase Pro add-on) serves admin analytics, `/search` and collection filters through a second client (`lib/supabase/replica.ts`, added when needed). Writes and anything in the checkout path stay on the primary.
- Storage growth: about 6 MB per product (8 images × 4 renditions). 2,000 SKUs is about 12 GB. `analytics_events` runs about 1.5 KB/row; at Scale that is 35M rows/month, roughly 50 GB/month raw, so the table is partitioned monthly, aggregated nightly, and raw partitions older than 13 months are dropped.

## 4. What breaks first, and the upgrade path

| # | Bottleneck | Symptom | Trigger | Fix (in order) |
|---|---|---|---|---|
| 1 | Hot-variant row contention during a drop | `POST /api/checkout` p95 > 1.5 s, lock waits | > 50 checkouts/min on one SKU | Atomic `UPDATE product_variants SET reserved = reserved + $q WHERE id=$v AND stock - reserved >= $q` (no `SELECT … FOR UPDATE`); 15-min reservation TTL; queue page (`/drop/[slug]` waiting room) if > 500/min |
| 2 | Uncached filter/search queries | DB CPU > 70% | Growth tier, sale traffic | Composite + GIN indexes (`products(status, category_id)`, `product_variants(product_id, size, color)`, `tsvector` on name/descriptor); cache per normalised query; move to replica |
| 3 | Outbox/email throughput | email lag > 5 min | > 100 emails/min | Resend batch API (100/call), bump worker frequency to 20 s via `pg_cron` seconds syntax; later Supabase Queues |
| 4 | Provider rate limits (Razorpay orders API, Shiprocket auth token) | 429 from provider | sale peak | Reuse Shiprocket token (10-day validity, cached in `integration_configs.meta`); create Razorpay order once per attempt only; backoff |
| 5 | `analytics_events` insert volume | write IOPS spikes | Scale | Batch client beacons (flush every 10 s or 20 events); ship raw events to PostHog only and store just commerce events in Postgres |
| 6 | Vercel function cold starts on checkout | p99 spikes | low traffic hours | Fluid compute (default), keep checkout routes on Node runtime in `bom1` |

## 5. Rate limiting

Two layers:
1. **Vercel Firewall rate-limit rules** handle coarse per-IP abuse at the edge before any function runs.
2. **Postgres limiter** `rate_hit(key text, window_s int, max int) returns boolean` on an `UNLOGGED` table `rate_limits` handles per-identity business limits. It is called in `route()` handlers that need it.

| Endpoint | Key | Limit | On exceed |
|---|---|---|---|
| `/*` (edge) | IP | 300 req / 60 s | 429 challenge |
| `/api/**` (edge) | IP | 120 req / 60 s | 429 |
| `POST /api/auth/*` | IP + email | Supabase Auth built-ins + 10 / 15 min | 429 `too_many_attempts` |
| `POST /api/cart/coupon` | cart_id | 10 / 10 min | 429 `coupon_rate_limited` (stops code brute force) |
| `POST /api/checkout` | cart_id + IP | 6 / 10 min | 429 |
| `POST /api/payments/intent` | order_id | 5 / 15 min | 429, UI says "Too many attempts, wait a few minutes" |
| `GET /api/track/[token]` | IP | 30 / 60 s | 429 |
| `POST /api/analytics/events` | visitor id | 60 / 60 s | drop silently (202) |
| Webhooks | not rate limited | signature verification is the gate | — |

## 6. SLOs

Measured at the origin (Vercel function duration + TTFB), 28-day rolling window.

| Endpoint / page | p50 | p95 | p99 | Availability |
|---|---|---|---|---|
| Cached pages (`/`, `/products/[slug]`, collections) TTFB | 60 ms | 200 ms | 500 ms | 99.95% |
| LCP on 4G mobile (390×844) | 1.6 s | 2.5 s | — | — |
| `GET /api/cart` | 60 ms | 180 ms | 400 ms | 99.9% |
| `POST /api/cart/items` | 90 ms | 250 ms | 600 ms | 99.9% |
| `POST /api/checkout/quote` | 120 ms | 350 ms | 800 ms | 99.9% |
| `POST /api/checkout` (order + reservation) | 180 ms | 500 ms | 1.2 s | 99.95% |
| `POST /api/payments/intent` (includes provider call) | 450 ms | 1.2 s | 2.5 s | 99.9% |
| `POST /api/payments/verify` | 150 ms | 400 ms | 1 s | 99.95% |
| `POST /api/payments/*/webhook` ack | 80 ms | 250 ms | 600 ms | 99.99% |
| `GET /api/track/[token]` | 80 ms | 250 ms | 600 ms | 99.9% |
| `/search` results | 150 ms | 450 ms | 1 s | 99.9% |
| Admin list pages | 250 ms | 800 ms | 2 s | 99.5% |
| Payment confirmed → email sent | — | 60 s | 5 min | — |
| Paid → Shiprocket order created | — | 2 min | 15 min | — |

Error budget: at 99.9%, about 43 min per month. When checkout or payment burns half the
budget, freeze feature deploys until the cause is fixed.

## 7. Load-testing plan (k6)

Tests live in `tests/load/*.js` and run against a **preview deployment backed by a Supabase branch**,
with payment providers in test mode and `PAYMENTS_MOCK=1` so the Razorpay/PayU adapters return
signed fake responses. Never run against production providers.

| Scenario | Script | Shape | Pass criteria |
|---|---|---|---|
| Browse | `browse.js` | ramp 0 → 500 VUs over 5 min, hold 10 min; home → collection → 3 PDPs → search | p95 TTFB < 500 ms, errors < 0.1% |
| Add to cart | `cart.js` | 200 VUs, 60 RPS `POST /api/cart/items` | p95 < 250 ms |
| Drop stampede | `drop.js` | 0 → 2,000 VUs in 60 s; all buy the same 3 variants with stock 300 | **zero oversell** (`sum(order_items.qty) ≤ 300`), p95 checkout < 1.5 s, losers see `out_of_stock` |
| Checkout + pay | `checkout.js` | 250 orders/min for 15 min: quote → checkout → intent → verify → mock webhook | p95 per SLO table; 0 duplicate orders; 0 duplicate captures |
| Webhook storm | `webhooks.js` | replay each webhook 5× concurrently, 600/min | exactly one `payments` capture per order; dedupe hits counted |
| Soak | `soak.js` | 30% of Scale normal peak for 2 h | no memory growth, no DB connection creep |

Before every planned sale: run `drop.js` at 2× expected concurrency, pre-warm caches by
requesting all drop PDPs, and temporarily raise DB compute one tier (it takes effect in about 2 min
and is billed hourly).

## 8. Cost tiers (monthly, estimated, ₹88 = $1)

| Item | Launch | Growth | Scale |
|---|---|---|---|
| Vercel Pro (2 seats + usage: functions, edge requests, image optimisation, bandwidth) | $40 + $10 = **$50** | $40 + $80 = **$120** | $40 + $400 = **$440** |
| Supabase Pro + compute | $25 + Small $15 = **$40** | $25 + Medium $60 = **$85** | $25 + Large $110 + replica $110 + PITR $100 = **$345** |
| Supabase storage / egress overage | $0 | $10 | $60 |
| Resend | Free (3k/mo) → Pro $20 | **$20** | Scale plan **$90** |
| PostHog (1M events free, then usage) | **$0** | **$0–50** | **$250** |
| GA4 | $0 | $0 | $0 |
| Cloud VTON (if enabled, about $0.04/generation) | 1k gens **$40** | 10k **$400** | 40k **$1,600** or keep on-device only |
| Monitoring (Vercel Log Drains → Better Stack / Axiom free tiers) | $0 | $25 | $100 |
| **Infra subtotal** | **≈ $150 (₹13k)** | **≈ $710 (₹62k)** | **≈ $2,900 (₹2.55 L)** |
| Payment MDR (about 2% of prepaid GMV, 70% prepaid) | ₹32k | ₹3.1 L | ₹12 L |
| Shiprocket (about ₹65 per 500 g shipment + COD fee) | ₹65k | ₹5.5 L | ₹20 L |

Infra stays under 0.5% of GMV at every tier. Payment and shipping fees dominate cost, so
negotiate Razorpay MDR and use PayU as a second gateway for leverage.
