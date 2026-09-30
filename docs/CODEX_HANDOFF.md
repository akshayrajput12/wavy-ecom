# CODEX HANDOFF — wavy (fashion e-commerce)

> Written 2026-09-26 by the Claude Code session that built this repo. Every claim was checked against the working tree at the time of writing.
> Repo: `D:\WAVY ecom` · branch `master` · one commit (`d3500f6 Initial commit from Create Next App`). **All work so far is staged and uncommitted** (see §13).

## Resume update — 2026-09-26



---

## 1. PROJECT OVERVIEW

**wavy** (renamed from "FORM/01"; the shop name is now "wavy") is a single-store, premium, editorial fashion e-commerce site for **clothing and sneakers** in India (INR, GST). It has:

- guest-first checkout;
- customer account (orders, returns, addresses) and public order tracking;
- content (FAQ, About, Lookbook, Journal/blog);
- an RBAC admin console covering catalog, inventory, orders, customers, reviews, marketing (coupons, offers, campaigns), SEO, blog, shipping, payment gateways, tax, integrations, staff, audit log and analytics.

**Stack** (all installed; see `package.json`):

| Area | Packages |
|---|---|
| Framework | Next.js **16.3.6** (App Router, Turbopack), React 19.2, TypeScript strict |
| Styling | Tailwind **v4**, token-driven from `src/app/globals.css` |
| Motion and UI | Framer Motion, Lenis (smooth scroll), lucide-react, clsx, sonner (toasts) |
| Forms and state | zod, react-hook-form + @hookform/resolvers, zustand (cart and wishlist UI state) |
| Backend / DB | Supabase via `@supabase/supabase-js` 2.117 and `@supabase/ssr` 0.12: Postgres, Auth, Storage, RLS |
| Dev | `supabase` CLI 2.118, vitest 4, prettier (+ tailwind plugin) |

**Architecture:**
- `src/app` holds thin routes.
- `src/views/<page>` holds page composition and page-only components.
- `src/components` holds global components.
- `src/data/*.ts` holds const/demo data and copy.
- `src/backend/<domain>` holds server-only "microservice" modules (`repo.ts`, and later `service.ts`, `schema.ts`, `providers/`).
- `src/app/api/**/route.ts` holds thin HTTP adapters wrapped in `route()` for failure isolation.
- Supabase schema lives in `supabase/migrations`.
- **Demo mode:** when the Supabase env vars are empty, every repo returns const data from `src/data`, so the whole UI renders with no backend.

---

## 2. CURRENT OBJECTIVE

The user's overall goal: build the full production-grade wavy e-commerce platform autonomously (the user wants minimal intervention), including:
- DB design with RBAC (admin, staff roles, customer), heavily indexed;
- payments with detailed failure tracking and admin-toggleable gateways;
- shipping and tracking, offers, admin tax, SEO/blog management;
- customer-journey tracking for support;

**The exact task in progress when this session stopped was "Wave 2: backend wiring".** Two background agents were launched for it but produced **no files** (the session ended first; see §5 and §8):
1. **Commerce backend**: `src/proxy.ts`, the Supabase branches in the repos, pricing/cart APIs, checkout, payment adapters and webhooks, orders/returns/tracking APIs, Shiprocket, Resend notifications and crons, analytics ingestion, rate limiting, and `docs/api/API_REFERENCE.md`.
2. **Admin backend**: the Supabase branches in `src/backend/admin/repo.ts`, all `/api/admin/**` mutation routes guarded with `requirePermission`, the customer-360 view, aligning admin demo data with the storefront data, and `docs/api/ADMIN_API.md`.

Codex should now do this wave-2 work (see §6).

---

## 3. CURRENT SESSION STATE

What happened in this session, in order:
1. Read the 5 spec `.docx` files, rebranded "FORM/01" to "wavy" inside them, moved them to `docs/specs/`, and added `.md` text copies. The original `docx/` folder was deleted.
2. Scaffolded Next.js with `create-next-app@latest` into a temp dir and moved it to the repo root (package name `wavy`). Installed all libraries and ran `supabase init`.
3. Wrote the foundation by hand:
   - `globals.css` tokens and root `layout.tsx` (fonts, Lenis, Toaster);
   - `logger.ts`, `env.ts`, `format.ts`, Supabase clients, `backend/_core/http.ts`;
   - `types/domain.ts` (shared contract) and UI primitives;
   - `docs/CONVENTIONS.md`, README, `.env.example`, `next.config.ts`, npm scripts.
5. Integration checks:
   - added `vitest.config.ts` (`@` alias);
   - ran a production build and smoke-tested routes with `next start` (all 200; admin dynamic routes that 500'd on an agent's dev server work in prod);
   - enabled the JWT hook in `supabase/config.toml`;
   - wrote `src/backend/_core/auth.ts`.
7. This session (after resuming): only verification plus writing this handoff.

**Verification at hand-off time (2026-09-26):**
- `npx tsc --noEmit` passes (exit 0).
- `npx eslint src`: 0 errors, 2 warnings (unused `_l` and `_m` in `src/lib/logger.ts:40`).
- `npx vitest run`: 24 tests passed.
- `supabase/tests/validate.mjs` (PGlite validation, 23 checks) passed at hand-off; the harness was later removed at the user's request.
- `npx next build`: **succeeds** (exit 0, no errors or warnings; about 85 routes/paths in the output).

---

## 4. COMPLETED WORK

### 4.1 Foundation (hand-written this session): all DONE
| File | What / why |
|---|---|
| `src/app/globals.css` | Full token system: colours, fluid type scale, spacing, radii, shadows, motion as `:root` vars. Exposed to Tailwind via `@theme inline` (`bg-canvas`, `text-ink`, `border-line`, `bg-accent`, `text-h1`…). Semantic classes `.t-hero .t-display .t-h1 .t-h2 .t-h3 .t-body .t-meta .t-overline`, plus `.container-x` and `.section-y`. This satisfies the user's rule of no hex in components and one place to change typography. |
| `src/app/layout.tsx` | Loads Instrument Sans and Instrument Serif via `next/font`, adds `<SmoothScroll/>` and `<Toaster/>`, and sets metadata from `data/site.ts`. `themeColor` is a literal (with a `ponytail:` comment). |
| `src/components/providers/SmoothScroll.tsx` | Global Lenis, skipped under reduced motion and on `/admin`. |
| `src/lib/logger.ts` | Structured logger: JSON lines in prod, coloured lines in dev. Has `child()` and key-based secret redaction (`pass|secret|token|authorization|api key|card|cvv|signature`). **Note:** the redaction hides any key containing "token", which includes `trackingToken`. |
| `src/lib/env.ts` | `hasSupabase` flag. This is the demo-mode switch. |
| `src/lib/format.ts` | `formatPrice(paise)`, `formatDate`, `slugify`. |
| `src/lib/supabase/{server,client,admin}.ts` | SSR cookie client (RLS), browser client, and a service-role singleton (`adminClient()`, bypasses RLS). |
| `src/backend/_core/http.ts` | `route(svc, handler)` wrapper: request id, timing log, turns ZodError into 422 and `ApiError` into its status, and a crash into a 500 with a ref. Also `ok()`, `fail()`, `parse(req, schema)`. |
| `src/backend/_core/auth.ts` | `getSession()` (React `cache`, uses `supabase.auth.getClaims()` and reads the `user_role` claim), `requireUser`, `requireStaff`, `requirePermission(perm)`. Returns null in demo mode. **Not yet used by any route.** |
| `src/types/domain.ts` | Shared contract. Enum arrays mirror the Postgres enums; types for Product, Variant, Cart, Order, Review, BlogPost, etc. Money is integer paise. |
| `src/components/ui/{Button,Input,Badge,States}.tsx` | `Button`/`ButtonLink`/`buttonClass`, a labelled `Input` with a field error, `Badge` and `StatusBadge` (status maps to tone and always shows text), `Skeleton`, `EmptyState`. |
| `docs/CONVENTIONS.md` | Mandatory folder, data, styling and quality rules. `CLAUDE.md` imports it. |
| `README.md`, `.env.example`, `next.config.ts` | Setup commands; env var names; image `remotePatterns` (images.unsplash.com, *.supabase.co); `optimizePackageImports`. |
| `vitest.config.ts` | `@` → `src` alias; includes `src/**/*.test.ts`. |
| `supabase/config.toml` | Enabled `[auth.hook.custom_access_token]` → `pg-functions://postgres/public/custom_access_token_hook`. `project_id = "WAVY_ecom"` (left as is). |
| `package.json` scripts | `typecheck`, `test`, `db:start`, `db:reset`, `db:types`. |

### 4.2 Database (wave-1 DB agent): DONE, validated in PGlite only
- Size: 69 tables (plus monthly partitions of `analytics_events`), 36 enums, about 448 indexes, 55 functions, 187 RLS/storage policies.
- **Reference data lives in the migrations, not the seed:** permissions, role map, payment gateways (Razorpay on, PayU off, COD on), store settings (GST 12%) and integration rows. `supabase/seed.sql` holds demo data only.
- (Removed later at the user's request.) `supabase/tests/pglite.mjs` provides stubs for the Supabase `auth` and `storage` schemas and the roles. `validate.mjs` runs all migrations and the seed, then 23 invariant asserts. `gen-types.mjs` generates `src/types/database.ts`.
- `src/backend/_core/permissions.ts`: `PERMISSIONS`, `ROLE_PERMISSIONS`, `can()`, `isStaffRole()`. `validate.mjs` fails if this drifts from the DB.
- Docs in `docs/database/`: `SCHEMA.md` (includes the deterministic seed UUID patterns), `ERD.md` (Mermaid), `RBAC.md` (includes the staff creation flow), `INDEXING.md`, `PAYMENTS_DATA.md` (support runbook SQL).

### 4.3 System design docs (wave-1): DONE
- `docs/system-design/01_ARCHITECTURE` … `08_ADMIN_MODULES.md`, plus `README.md` and `images/*.svg` (architecture, payment-flow, payment-failure-states, order-state-machine).
- `docs/design/DESIGN_SYSTEM.md` and `docs/design/SCREENS.md` (Stitch screen → route → view folder map).

  - `engine/poseTracker.ts`: MediaPipe PoseLandmarker; wasm pinned to jsDelivr `@mediapipe/tasks-vision@1.0.1`; EMA smoothing.
  - `engine/garmentFit.ts` + `garmentFit.test.ts`.
  - `analytics.ts`: sendBeacon to `/api/analytics/events`, which doesn't exist yet and fails silently.
  - `index.ts`.

### 4.5 Storefront UI (wave-1): DONE (demo data)
- Routes in `src/app/(store)`: `/`, `/editorial`, `/collections`, `/collections/[slug]`, `/new-in`, `/search`, `/products/[slug]` (static params, metadata, Product JSON-LD), `/wishlist`, `/cart`, `/faq` (FAQ JSON-LD), `/about`, `/lookbook`, `/journal`, `/journal/[slug]`, plus `loading.tsx`, `error.tsx` and `not-found.tsx`. `src/app/sitemap.ts` and `robots.ts` exist.
- `src/components/ui`: `Drawer`, `Modal` (native `<dialog>`), `Controls.tsx` (Chip, QuantityStepper, Select, Accordion), `Reveal` (Framer Motion).
- `src/components/layout`: Header, Footer, NewsletterForm, AnnouncementBar.
- `src/components/commerce`: ProductCard, ProductGrid, ProductRail, PriceTag, RatingStars, WishlistButton, ArticleCard; `cart/` (CartDrawer, CartParts, `cartMath` + test); `filters/` (FilterPanel, FilterToolbar, params).
- `src/stores/cart.ts` (`useCart`, `toCartLine`, `cartCount`, persisted) and `src/stores/wishlist.ts`.
- Data files: `src/data/{products,categories,collections,home,navigation,reviews,content,journal}.ts`. There are 20 products with ids `p_001`–`p_020` and variant ids like `v_001_blk_m`.
- Size finder is a pure function with a test in `src/views/product`.

### 4.6 Checkout / account UI (wave-1): DONE (demo data)
- `/checkout` is a single route with a 4-step stepper, a payment failure screen with retry, and `/checkout/success/[orderNumber]`.
- `/login`, `/signup` and `/forgot-password` use server actions in `src/views/auth/actions.ts`.
- `/account/**` covers overview, orders, order detail, returns, new return, return success, addresses and profile, under an auth-guarded layout.
- `/track/[token]` lives at `src/app/(account)/track/[token]`.
- `src/data/{orders,account,checkout}.ts` hold 5 demo orders.
- Tests: `views/checkout/totals.test.ts` and `views/returns/eligibility.test.ts`.
- `src/views/checkout/placeOrder.ts` defines the client contract for `POST /api/checkout` (see §10.3).

### 4.7 Admin UI (wave-1): DONE (demo data, mutations client-side only)
- `src/components/admin/*`: AdminShell (black rail and dev-only role switcher), DataTable, StatCard, ChartCard, TrendChart, Bars, Dialog, Fields, Panel, SeoFields, `useRole`, format.
- `src/views/admin/<screen>/View.tsx`. `src/views/admin/rbac.ts` imports `_core/permissions.ts`. `src/views/admin/api.ts` is the `adminApi` helper; it treats a 404 as a local success.
- `src/data/admin.ts` re-exports `src/data/admin/{catalog,insights,marketing,orders,settings,types}.ts`.
- `src/backend/admin/repo.ts` has the getters listed in §10.
- Test: `src/views/admin/tax/components/calc.test.ts`.

---

## 5. IN-PROGRESS WORK

**Wave-2 backend: launched, zero output.** Nothing is partially written, so start fresh. Status of the pieces:

| Item | Done | Remains | Relevant files |
|---|---|---|---|
| Auth guard | `src/backend/_core/auth.ts` written | Not used anywhere yet | `_core/auth.ts`, `_core/permissions.ts` |
| Route protection | nothing | `src/proxy.ts` (session refresh, `/account` and `/admin` gates, pass-through in demo mode) | `src/app/admin/layout.tsx` (has a TODO), `src/app/(account)/account/layout.tsx` |
| Supabase repo branches | `if (hasSupabase) { /* TODO */ }` stubs fall through to const data | Real queries plus row→domain mapping | `src/backend/{catalog,content,orders,admin}/repo.ts` |
| Checkout API | Client side done (`placeOrder.ts`, with a demo mock) | `POST /api/checkout` | `src/views/checkout/placeOrder.ts`, RPCs `place_order` and `start_payment_attempt` |
| Payments | DB functions done | Provider adapters, verify/webhook/retry/event routes, Razorpay Checkout.js in the payment step | `0015_commerce_rpcs.sql`: `start_payment_attempt`, `record_payment_failure`, `mark_payment_captured`, `reconcile_order_payment` |
| Coupon / quote API | UI calls `/api/cart/coupon` and handles failure | `POST /api/cart/quote`, `POST /api/cart/coupon` | `src/components/commerce/cart/CartParts.tsx:110`, RPCs `quote_cart` and `apply_coupon` (both take `p_cart_id`) |
| Returns API | UI posts multipart and falls back to demo | `POST /api/returns` | `src/views/returns/components/ReturnForm.tsx:45` |
| Tracking API | Page reads the repo (demo) | `GET /api/track/[token]` via the RPC `get_order_tracking` | `src/backend/orders/repo.ts:getOrderByTrackingToken` |
| Admin mutations | UI is optimistic and calls `adminApi(resource, body)` | `/api/admin/**` routes | 48 `TODO(backend agent)` markers across `src/views/admin/**`, `src/components/admin/useRole.ts`, `src/app/admin/layout.tsx` |

Find every stub with `grep -rn "TODO(backend agent)" src` (48 hits) and `grep -rn "ponytail:" src` (19 deliberate shortcuts).

---

## 6. NEXT STEPS (ordered; start here)

1. **Commit the current state first** (the user hasn't asked for commits so far; ask or follow their instruction). Everything is staged on `master`, and nothing has been committed since create-next-app.
2. **`src/proxy.ts`:**
   - Refresh the session with the `@supabase/ssr` `updateSession` pattern (read `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`).
   - Gate `/account/**` (redirect to `/login?next=`).
   - Gate `/admin/**`: require the `user_role` claim to be something other than `customer`.
   - When `!hasSupabase`, let everything through (demo mode).
3. **Unify failure-stage vocabulary** on the DB enum `payment_failure_stage`: order_creation, checkout_open, user_cancelled, bank_declined, otp_timeout, insufficient_funds, signature_mismatch, amount_mismatch, webhook_timeout, capture_failed, gateway_error, risk_blocked, network_error, unknown. Update:
   - `src/data/checkout.ts` `FAILURE_STAGES` (currently only 6 keys);
   - `src/data/admin/types.ts` `FailureStage` (currently `gateway_init|customer_auth|bank_decline|verification|timeout|none`) and the admin demo data and UI labels.
4. **Unify demo offer and pricing rules.** Three different rules exist today:
   - DB: "3 for ₹999" `bundle_fixed_price`;
   - storefront `cartMath`: "any N for ₹X";
   - `src/data/checkout.ts` `bundleOffer`: "3+ items, 15% off".

   Make them one rule (the DB's "3 for ₹999" is canonical) and make coupon demo data match the DB (WELCOME10 capped at ₹500, FREESHIP).
5. **Pricing service** `src/backend/pricing`:
   - Prefer the DB `quote_cart`/`compute_pricing` functions. Check their signatures in `0015_commerce_rpcs.sql`; `quote_cart(p_cart_id, …)` needs a DB cart, so either sync the zustand cart into `carts`/`cart_items` or use `compute_pricing` if it accepts lines.
   - In demo mode, a pure TS `quote()` over paise following `docs/system-design/06_PRICING_TAX_OFFERS.md`, with a vitest test.
   - Routes: `POST /api/cart/quote`, `POST /api/cart/coupon`, returning `CartTotals` including `offerNudges`.
6. **Checkout and payments:**
   - `POST /api/checkout`: `idempotency-key` header; zod-validate `PlaceOrderBody`; map it to the `place_order(p_idempotency_key, p_payload)` camelCase payload (documented at `0015_commerce_rpcs.sql` around line 518); call `start_payment_attempt`; the provider creates its order; return `{orderNumber, redirectUrl?, payment:{status, failureStage?}}` as `placeOrder.ts` expects.
   - Adapters: `src/backend/payments/providers/{razorpay,payu,cod}.ts` behind one `PaymentProvider` type (createOrder, verifyCallback, parseWebhook, refund).
   - Routes: `POST /api/payments/verify`, `POST /api/payments/razorpay/webhook`, `POST /api/payments/payu/webhook` (raw-body HMAC; dedupe into `payment_events` by `(provider, provider_event_id)`), `POST /api/payments/retry` (new attempt, same order; refuse if paid), `POST /api/payments/event` (records `user_cancelled` or `checkout_open` via `record_payment_failure`).
   - Capture only via `mark_payment_captured`, which is idempotent and flags duplicates.
   - Load Razorpay Checkout.js on demand in the payment step.
   - Only use gateways that are enabled in `payment_gateways`.
7. **Orders, returns and tracking APIs:** `GET /api/orders`, `GET /api/orders/[number]`, `GET /api/track/[token]` (RPC `get_order_tracking`), `POST /api/returns` (multipart; check eligibility on the server; upload to the private `return-evidence` bucket), `GET /api/orders/[number]/invoice`.
8. **Shipping:**
   - `src/backend/shipping/providers/shiprocket.ts` (token cached in memory with expiry, create AWB, tracking).
   - PDP serviceability check now lives at `GET /api/shipping/serviceability?pincode=...`; token auth/query are server-side, and credential steps are in `docs/integrations/SHIPROCKET_SETUP.md`. Checkout must still recalculate from final cart and payment mode.
   - Webhook at **`POST /api/hooks/courier-status`**. Shiprocket rejects webhook URLs containing "shiprocket", "kartrocket", "sr" or "kr". Check a token header; insert into `shipment_events` idempotently; transition the order status.
9. **Notifications and crons:**
   - Resend templates: order placed, payment failed with retry link, shipped, delivered, returns.
   - Log sends to `notification_log`.
   - **There is no `outbox` table in the migrations**, although the docs mention one. Either add a migration or send inline with retry.
   - `vercel.json` crons protected by `CRON_SECRET`. The DB already schedules `release_expired_reservations`, `publish_scheduled_posts` and analytics partitions via pg_cron when it is installed.
10. **Analytics:** `POST /api/analytics/events` (batch ≤20; zod against the `analytics_event_name` enum; visitor id cookie; insert with the service client; respond 202) plus a `src/lib/analytics.ts` `track()` helper, wired at page_view, product_viewed, add_to_cart, checkout_started and payment_*.
11. **Wire the repo Supabase branches:** catalog, content, orders, then admin. Map snake_case to the domain types, select explicit columns, use the server client so RLS applies.
12. **Admin mutation APIs:**
    - Routes: `src/app/api/admin/**` → `src/backend/admin/<module>/service.ts`, each guarded with `requirePermission`. Replace each `TODO(backend agent)` call site.
    - Rules to keep: never disable the last enabled gateway; never demote the last super_admin; staff invites go through `adminClient().auth.admin.inviteUserByEmail`; reviews never set `verified_purchase` (a trigger owns it).
13. **Customer 360** (`/admin/customers/[id]`): profile, orders, payment attempts with failure stages, shipments, tickets and journey (RPC `get_customer_journey`, gated by `journey.read`).
14. **Demo data alignment:** see §8.9.
15. **Rate limiting:** `src/backend/_core/rateLimit.ts` as an in-memory sliding window, with a `ponytail:` comment noting it is per-instance and should move to Upstash or Postgres later. Apply it to checkout, coupon, auth and analytics.
17. **Promote shared checkout/account components to `src/components`**, since they are used in 2+ views: `AddressForm`, `OrderSummary`, `Timeline`, `OrderRow` (also candidates: `Stepper`, `AuthShell`, `FormAlert`). Move the `PaymentAttempt`, `AccountOrder` and `ReturnRequest` types into `types/domain.ts`.
18. Run the full verification in §17.

---

## 7. IMPORTANT DECISIONS (preserve these)

- **Brand is "wavy".** Brand text comes from `src/data/site.ts`. Never reintroduce "FORM/01".
- **Design:**
  - The design-system doc palette (light, warm off-white, ink, peach accent) wins over the Stitch project's theme, which is a default dark/cyan and was rejected.
  - Fonts are **Instrument Serif** (editorial display) and **Instrument Sans** (UI). This replaces Inter, which the user called "very bad".
  - Light theme only.
- **No hex in components.** Only tokens and CSS vars; recharts uses `"var(--accent)"` strings.
- **Tailwind v4 was chosen over CSS modules**, because the `@theme inline` tokens make the utilities token-bound.
- **Money** is integer paise everywhere. Pricing is server-authoritative. Idempotency keys are used for orders and payments. Webhooks are deduped by provider event id.
- **Payments:**
  - Card data never touches our pages (Razorpay/PayU hosted checkout, PCI SAQ-A). Stitch screen 19 shows card fields; the decision is not to build them, and the user should confirm with design.
  - `mark_payment_captured` is the single path to `paid`; the docs call it `confirm_payment()`, and **the migrations win**.
  - Each retry is a new `payment_attempts` row.
- **RBAC:**
  - Roles: customer, super_admin, catalog_manager, order_manager, marketing_manager, analyst, support_agent.
  - The permission map in `_core/permissions.ts` must equal `public.role_permissions` (validator enforced).
  - The role reaches the JWT via the `custom_access_token_hook` claim `user_role`.
  - Signup always creates a `customer`, and client metadata can't set the role.
  - Enforced in four layers: `proxy.ts`, the admin layout, backend `requirePermission`, and RLS.
- **Reference data (gateways, settings, permissions) lives in migrations**, so production gets it; `seed.sql` holds demo data only.
- **New SQL functions are not callable by anon/authenticated unless explicitly granted.** Commerce RPCs are service-role only, so call them with `adminClient()` from the backend after your own checks.
  - The enabled path is the in-house on-device MediaPipe overlay; no camera photo is uploaded and no paid provider is active.
  - Photo synthesis is disabled and provider code has been removed; do not re-add a paid provider without approval and updated privacy/retention requirements.
  - Rejected: open-source VTON models (non-commercial licences), DeepAR ($500–1,000/mo), Snap Camera Kit (a custom lens per product).
  - Always show the disclaimer "Visual preview only — not a size or fit guarantee".
- **Other decisions:**
  - The Shiprocket webhook path is `/api/hooks/courier-status`.
  - Cron and scheduled jobs use pg_cron where available; otherwise Vercel Cron hits `/api/cron/*`.
  - Logging uses `logger.child({svc})` with `domain.action` event names and never `console.log`. Log only the first 4 characters of tracking tokens, under a non-"token" key (the redactor hides "token" keys).
  - Tax is one store-wide GST rate on goods plus shipping plus the COD fee. GST slabs by price are not modelled in the DB, although the pricing doc discusses slabs; decide or keep single-rate.
- **Ponytail mode** (user-installed plugin): prefer the laziest correct solution, no speculative abstractions, and mark deliberate shortcuts with `// ponytail:` comments that name the ceiling and the upgrade path.

---

## 8. ERRORS / PROBLEMS

1. **Wave-2 agents produced nothing.** Symptom: no backend files. Cause: the session ended while they were running. Status: open, and it is the whole of §6.
2. **Admin dynamic routes returned 500 on an agent's shared dev server (:3100).** Cause: that dev server's worker was crashing on any newly compiled dynamic route; the code was fine. A production build with `next start` returned 200 for `/admin/products/p-core-tee`, `/admin/orders/BB-10421` and `/admin/customers/c-aarav`. Status: resolved. If dev-mode 500s recur, restart `next dev` and delete `.next`.
3. **Unknown product or collection URLs render the 404 UI with HTTP 200.** Cause: Next streaming with `loading.tsx` in the `(store)` segment. Status: known, left as is. Fix by moving `loading.tsx` lower, or accept it (noindex is set).
4. **Heredoc quoting in Git Bash broke a multi-file write** (`unexpected EOF`). Use the Write tool or separate files. Nothing was lost.
5. **Docker is not installed**, so `supabase start` and `db reset` can't run locally. Migrations are validated only in PGlite (Postgres 18). Recommended: `supabase db push` to a hosted project and run a smoke test.
6. **`npm test` initially failed on `@/` imports.** Fixed by adding `vitest.config.ts`.
7. **Failure-stage vocabulary mismatch** across the DB, `src/data/checkout.ts` and `src/data/admin/types.ts`. Open (§6 step 3).
8. **Offer rule mismatch** across the DB, `cartMath` and `data/checkout.ts`. Open (§6 step 4).
9. **Demo data isn't aligned with the seed:**
   - storefront: 20 products `p_001`–`p_020`, collections including clothing, sneakers, monsoon-edit, studio-essentials, latest-drop, 3-for-999;
   - admin: its own ids like `p-core-tee` and order numbers `BB-10421`;
   - `seed.sql`: 16 products with UUIDs `30000000-0000-4000-8000-0000000000NN`, collections everyday-basics, new-season, sneaker-edit, order numbers like `wavy-100001`.

   Consequences:
   - Once Supabase is on, persisted zustand carts holding `v_…` ids will be invalid, so clear or migrate localStorage.

   Recommended: make `seed.sql` mirror `src/data/products.ts` (or the reverse) and point admin demo data at the storefront data.
10. **The `outbox` table is referenced in the system-design docs but doesn't exist in the migrations.** Open.
12. **Lint warnings:** `_l` and `_m` unused in `src/lib/logger.ts:40`. Cosmetic.
13. **MCP limitations:**
    - There is no Sketch MCP. The user mentioned Sketch but the Stitch project was used: id `11414759065021159242`, "FORM/01 Fashion Commerce System", 32 screens plus a logo. Note that Stitch's numbering differs: Stitch "49" is catalogue #51 Coupons, and there is no Stitch design for #49 Review Composer.
    - The user mentioned a Figma plugin `code.js`, but it was never provided in the repo.
    - Several claude.ai MCP servers (Vercel, Linear, Miro, etc.) needed OAuth and weren't used.
14. **`README.md` says "psql "$DB_URL" -f supabase/seed.sql"**; verify that works with the hosted connection string.

---

## 9. FILE MAP

```
CLAUDE.md                 imports AGENTS.md + docs/CONVENTIONS.md (agent rules)
AGENTS.md                 Next 16 warning: read node_modules/next/dist/docs before coding (auto-written by next dev)
README.md                 setup + Supabase connect steps + scripts
.env.example              env var NAMES (copy to .env.local; .env.local is not present at hand-off)
next.config.ts            image remotePatterns, optimizePackageImports
vitest.config.ts          @ alias
supabase/config.toml      local stack config; JWT hook enabled
supabase/migrations/      0001–0017 schema/RLS/RPCs (source of truth for names)
supabase/seed.sql         demo data (deterministic UUIDs)
docs/specs/               PRD, SRS, UI/UX DS, 56-screen catalogue, Data/API reqs (.docx + .md)
docs/system-design/       01–08 + README + images/*.svg
docs/database/            SCHEMA, ERD, RBAC, INDEXING, PAYMENTS_DATA
docs/design/              DESIGN_SYSTEM.md, SCREENS.md (Stitch map)
src/app/layout.tsx        root layout (fonts, Lenis, Toaster)
src/app/globals.css       ALL design tokens
src/app/(store)/          storefront routes (+ layout with Header/Footer/CartDrawer)
src/app/(account)/        login/signup/forgot, account/**, track/[token]
src/app/checkout/         checkout + success
src/app/admin/            admin routes (layout = AdminShell, noindex)
src/app/sitemap.ts, robots.ts
src/views/<page>/         page views + page-only components (admin/* per screen)
src/components/ui|layout|commerce|admin|providers   global components
src/stores/cart.ts, wishlist.ts   zustand (persisted)
src/data/*.ts, src/data/admin/*.ts   const/demo data + copy
src/backend/_core/        http.ts, auth.ts, permissions.ts
src/backend/{catalog,content,orders,admin}/repo.ts   data access (Supabase branches are TODO)
src/lib/                  logger, env, format, supabase clients
src/types/domain.ts       shared contract; database.ts generated DB types
```

---

## 10. DATABASE / API / BACKEND

### 10.1 Schema highlights (full detail in `docs/database/SCHEMA.md`)
- **Identity:** `profiles` (role, status), `staff_members` (invited, active, suspended; a trigger syncs the role), `role_permissions`. Functions: `has_permission`, `auth_role`, `is_staff`, `custom_access_token_hook`, `handle_new_user`, `bootstrap_super_admin`.
- **Catalog:** categories (tree), collections, products (with a tsvector search column), media, variants, inventory, inventory movements, and reservations.
- **Commerce:** carts, cart_items, checkout_sessions, addresses, orders (idempotency_key, tracking_token, snapshots), order_items, order status history, payment_gateways, payments, **payment_attempts** (`failure_stage`), payment_events (deduped), refunds.
- **Fulfilment:** shipping methods and zones, shipments, shipment_events, return_requests and return_items.
- **Marketing and content:** coupons, coupon_redemptions, offers (including `bundle_fixed_price`) and redemptions, campaigns, testimonials, content_pages, faqs, lookbook, blog_posts and categories/tags, seo_overrides, redirects, reviews (+ media, votes; `verified_purchase` is set by a trigger only).
- **Analytics and support:** visitor_sessions, analytics_events (partitioned by month), support_tickets and messages.

### 10.2 RPCs to use (in `0015_commerce_rpcs.sql` unless noted)
- **Pricing:** `quote_cart(p_cart_id, p_shipping_method_id, p_payment_provider, p_state)`, `compute_pricing`, `apply_coupon(p_cart_id, p_code)`.
- **Orders:** `place_order(p_idempotency_key, p_payload jsonb)`, which is idempotent, advisory-locked, and returns `order_json` (`orderId`, `orderNumber`, `status`, `paymentStatus`, `total`, `trackingToken`, `paymentId`, `replayed`). Also `cancel_order` and `order_status_allowed`.
- **Payments:** `start_payment_attempt(p_order_id, p_provider, p_provider_order_id, p_method, p_raw_request, p_client_ip, …)`, `record_payment_failure(p_attempt_id, p_stage, p_code, p_reason, p_source, p_raw, …)`, `mark_payment_captured(p_order_id, p_attempt_id, p_provider_payment_id, p_amount, p_method, p_raw, …)`, `reconcile_order_payment(p_order_id)`.
- **Inventory:** `reserve_inventory`, `release_inventory`, `commit_order_inventory`, `release_expired_reservations`, `adjust_inventory`.

### 10.3 Client contracts already in the UI
- `POST /api/checkout`:
  - header `idempotency-key`;
  - body `PlaceOrderBody { contact, address(country "IN"), shippingMethodId, paymentMethodId, coupon?, lines[{variantId, quantity}], orderNumber? }`;
  - response `{ ok, data: { orderNumber, redirectUrl?, payment?: { status, failureStage? } } }`;
  - in demo mode a 404 or 501 becomes a mock order, and an email containing `+fail` simulates `bank_declined`.
- `POST /api/cart/coupon` with `{ code }` (CartParts.tsx).
- `POST /api/returns` with multipart (ReturnForm.tsx).
- `POST /api/admin/<resource>` via `adminApi` (`src/views/admin/api.ts`), which never throws and treats a 404 as success until the routes exist.

### 10.4 Existing repo functions
- `catalog`: `getProducts`, `searchProducts`, `getProductBySlug`, `getProductsByIds`, `getRecommendations`, `getCategories`, `getCollections`, `getCollection`, `getNewIn`, `getFacets`, `getReviews`.
- `content`: `getFaqs`, `getLookbook`, `getBlogPosts`, `getBlogPost`, `getTestimonials`.
- `orders`: `getAccountUser`, `getOrdersForUser`, `getOrderByNumber`, `getOrderByTrackingToken`, `getAddresses`, `getReturnsForUser` (the last one should move to `backend/returns`).

### 10.5 Integrations (not yet implemented in code)

---

## 11. FRONTEND

- **Route groups:**
  - `(store)`: AnnouncementBar, Header (transparent over the hero, solid on scroll), Footer, CartDrawer.
  - `(account)`: shares the storefront chrome and also hosts `/track/[token]`.
  - `checkout`: minimal header.
  - `admin`: AdminShell with the black rail.
- **Pages are thin:** page (a Server Component) calls the repo, then renders `<XView data/>`, and components receive props. Copy lives in `src/data`.
- **State:** `useCart` (lines, drawer state, persisted) and `useWishlist` (guest, localStorage). Cart totals in the browser are estimates (`cartMath`); the server must be authoritative at checkout.
- **Motion:** `Reveal` (Framer Motion, reduced-motion aware) and global Lenis.
- **Forms:** react-hook-form + zod with field-level errors.
- **Unfinished UI work:**
  - Razorpay Checkout.js integration in the payment step (only a redirect URL is handled today).
  - Addresses and profile saves only update the page or show a toast.
  - Pincode delivery check and newsletter are mocks (`ponytail:` comments).
  - The admin customer journey panel is not gated by `journey.read`.
  - The dev-only role switcher in AdminShell must stay dev-only.
  - The components listed in §6 step 17 need promoting.

---

## 12. ENVIRONMENT / DEPLOYMENT

Env var **names** (from `.env.example`):
- **App:** `NEXT_PUBLIC_SITE_URL`, `LOG_LEVEL`.
- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Payments:** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `PAYU_MERCHANT_KEY`, `PAYU_MERCHANT_SALT`, `PAYU_BASE_URL`.
- **Shipping:** `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_WEBHOOK_TOKEN`.
- **Email and analytics:** `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_GA4_ID`.
- **To add:** `CRON_SECRET`, and probably `NEXT_PUBLIC_RAZORPAY_KEY_ID` for Checkout.js.

**Demo mode:** leave the Supabase vars empty. `.env.local` does not exist; create it with `cp .env.example .env.local`. `.gitignore` from create-next-app ignores `.env*`.

**Deployment target:** Vercel (docs assume it) plus hosted Supabase:
- `supabase link` → `supabase db push`, then load the seed.
- Enable the Custom Access Token hook in Dashboard → Auth → Hooks.
- Create the storage buckets (migration `0017`).
- Optional pg_cron / pg_net.

There is no `vercel.json` yet.

---

## 13. GIT STATE

- **Branch:** `master`. **Commits:** only `d3500f6 Initial commit from Create Next App`. No remote was configured by this session.
- **Everything is staged (index = working tree) and nothing has been committed:** 344 entries (A/M/D), with no unstaged or untracked files at the time of checking. There are no worktrees and no stashes.
- **Modified vs the initial commit:** `CLAUDE.md`, `README.md`, `next.config.ts`, `package.json`, `package-lock.json`, `src/app/layout.tsx`, `src/app/globals.css`.
- **Deleted:** `public/{file,globe,next,vercel,window}.svg`, `src/app/page.tsx` (replaced by `src/app/(store)/page.tsx`).
- **Added:** everything else in §4 and §9.
- **Must not be reverted:** all of it. In particular:
  - `supabase/migrations/*` (validated);
  - `src/backend/_core/permissions.ts` (the validator checks it against the DB);
  - `docs/specs/*` (the rebranded originals; the old `docx/` folder was deleted and there is no other copy in the repo);
  - `supabase/config.toml` (hook enabled).
- `AGENTS.md` and `CLAUDE.md` contain a block that `next dev` re-adds automatically; commit it as is.

---

## 14. CLAUDE CONTEXT (rules Codex must follow)

- **From `AGENTS.md`:** this is Next.js 16 with breaking changes, so read `node_modules/next/dist/docs/` before writing framework code:
  - `middleware` is now `proxy.ts`;
  - `params`, `searchParams`, `cookies()` and `headers()` are async;
  - `next lint` is replaced by the ESLint CLI;
  - Turbopack is the default;
  - `LayoutProps<"/">` and `PageProps` are global typed helpers.
- **From `docs/CONVENTIONS.md`** (read it in full):
  - folder placement; a component moves to `src/components` once it is used in a 2nd view;
  - no hard-coded content in JSX, it comes from `src/data`;
  - the `app → repo → View → components` data flow, with a const fallback in every repo;
  - API routes use `route()`, `parse()`, `ok()` and `ApiError`;
  - server-authoritative prices, idempotent writes, the logger (no `console.log`), money in paise;
  - no hex, token utilities only, the `.t-*` type classes;
  - TS strict with no `any`, files under about 200 lines;
  - accessibility basics, `next/image` with `sizes`, and one vitest per money or security path.
- **`.claude` memory:** no project memory files exist (`~/.claude/projects/d--WAVY-ecom/memory/` exists but is empty).
- **Plugin:** the user installed "ponytail" (Claude plugin) and wants its minimal-code discipline applied throughout.

---

## 15. CONVERSATION-DEPENDENT KNOWLEDGE

- **Working style:** the user wants full autonomy ("take all control… always yes from my side… I want to go out and you build all"). Proceed step by step without asking for permission on routine work. Use parallel agents where useful. Store every doc and diagram in `docs/`.
- **Requested features to keep in scope:**
  1. **Component-based structure:** a page folder with its own components, a component moved to global when reused, pages composed as a single view, and data from `.ts` files per domain (for example `orders.ts`, `products.ts`).
  2. **APIs in a backend folder**, microservice-style: fast, scalable, and isolated so one failure doesn't affect the rest.
  3. **`logger.ts`** with clean, optimized logs, used for payments too.
  4. **Payments:**
     - multiple gateways (Razorpay, PayU, COD), each switched on or off by the admin;
     - detailed tracking of where a payment failed and at which step;
     - the customer never pays twice;
     - support can inspect everything about a payment.
  5. **Customer journey tracking** (pages visited, issues) for shipping and support.
  6. **Shipping and tracking:** Shiprocket, with a public tracking link sent to the customer.
  7. **Admin settings:** gateway on/off, tax percentage at checkout.
  8. **Offers and coupons**, including bundles like "any 3 items for ₹999" with an on-site nudge ("add 2 more…").
  9. **SEO manager and blog CMS** in admin (SEO-optimized product listings), category management, and product ranking/actions.
  10. **Full RBAC:** super admin, staff roles, customer. Staff access designed and implemented in detail. Define what gets set when a user or staff member is created.
  11. **Detailed, interlinked, heavily indexed SQL** so everything is fast, with more tables and columns where needed.
  12. **Const data** so the UI works before the SQL is run, and real-time data after it is.
  14. **System design and capacity** (requests and payments handled), with images in `docs/`.
- **Design:**
  - Reference sites: Dryrobe, Peregrine Clothing, 2nd STREET USA, Refashion, Readymag.
  - The Stitch designs are a reference, not something to replicate pixel-for-pixel; the user disliked their fonts.
  - Root CSS variables are mandatory. Typography must be changeable globally and per heading.
- **The user asked for "production ready" grade, but** phrased it as "first our approach should be understandable, then we'll harden for production".
- **Not done on purpose:**
  - no card fields on our own pages;
  - no dark theme (PRD out of scope);
  - no multi-vendor features;
  - no stored card data;
  - no AI fit guarantee.

---

## 16. DO NOT REPEAT

- Don't re-scaffold Next.js, reinstall the libraries, re-run `supabase init`, or re-rebrand the docs. All of that is done.
- Don't re-create the design tokens, fonts, logger, `http.ts`, `auth.ts`, the Supabase clients, `domain.ts` or the UI primitives. Extend them instead.
- Don't rewrite the migrations from scratch. Add new numbered migrations (`0018_…`) for changes, and verify with `supabase db reset` or `db push`.
- Don't chase the dev-server 500s on admin dynamic routes; prod works.
- Don't try `supabase start` without Docker; use PGlite validation or a hosted project.
- Don't rely on the wave-2 agents' output: none exists.

---

## 17. VERIFICATION

```bash
npm install
npx tsc --noEmit                    # expect exit 0
npx eslint src                      # expect 0 errors (2 known warnings in logger.ts)
npx vitest run                      # expect all pass (24 at hand-off)
npx next build                      # expect success
npx next start -p 3300              # smoke test, then STOP the server
```

**Production build at hand-off:** passed on 2026-09-26 (clean `.next`, exit 0, no errors or warnings).

Smoke URLs:
- Storefront: `/`, `/collections/clothing`, `/products/essential-crew-tee`, `/cart`, `/checkout`, `/track/bad` (404), `/account`.
- Admin: `/admin` (307 to the dashboard), `/admin/dashboard`, `/admin/orders/BB-10421`, `/admin/products/p-core-tee`, `/admin/customers/c-aarav`.

After backend work, also curl:
- `/api/cart/quote` and `/api/cart/coupon`;
- `/api/checkout` in demo and real mode, with the same idempotency key twice to confirm one order;
- `/api/analytics/events` (202);
- `/api/track/<bad>` (404);
- the webhooks with a bad signature (401).

**Manual checks:**
- Walk the checkout (the `+fail` email tests the failure and retry path).
- Switch admin roles with the dev role switcher to confirm "No access" states.
- Against a hosted Supabase: sign up (profile gets `customer`), invite staff, confirm the JWT carries `user_role`, and confirm RLS blocks cross-customer reads.

Always stop any dev or prod servers you start. Leftover servers caused confusion in this session.

---

## CONTINUE FROM HERE

1. Read `AGENTS.md`, `docs/CONVENTIONS.md`, this file, `docs/system-design/03_PAYMENTS.md` and `06_PRICING_TAX_OFFERS.md`, `docs/database/SCHEMA.md`, and `supabase/migrations/0015_commerce_rpcs.sql`.
2. Run the §17 commands to confirm the green baseline, then commit the staged work if the user agrees.
3. Start §6 at step 2 (`src/proxy.ts`), then do steps 3–4 (unify failure stages and offer rules), then steps 5–10 (pricing, checkout and payments, orders/returns/tracking, shipping, notifications, analytics). Each backend domain goes in its own `src/backend/<domain>/` module behind thin `src/app/api/**` routes using `route()`, with RPCs called through `adminClient()` after `requireUser` / `requirePermission` checks.
4. Then do steps 11–13 (Supabase repo branches, admin APIs replacing the 48 `TODO(backend agent)` markers, customer 360), step 14 (align the seed and demo data), steps 15–17, and a full §17 verification.
