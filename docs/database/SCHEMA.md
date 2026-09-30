# wavy: database schema (backend contract)

Postgres (Supabase): 69 tables, 36 enums, 17 migrations in `supabase/migrations/`. Types: `src/types/database.ts` (Supabase gen-types shape; regenerate with `npm run db:types` once a local stack runs). Related: [ERD.md](ERD.md), [RBAC.md](RBAC.md), [INDEXING.md](INDEXING.md), [PAYMENTS_DATA.md](PAYMENTS_DATA.md).

## Conventions

- Money is **integer paise**. Prices, totals, coupons, tax and stock are computed in SQL (`compute_pricing`, `place_order`); client prices are never read.
- IDs `uuid`, timestamps `timestamptz`, every `updated_at` has a `set_updated_at` trigger (0014 loop).
- RPC JSON uses **camelCase**; table columns are snake_case.
- RLS on every table. Storefront reads with anon/authenticated keys; checkout, webhooks, cron and admin writes go through the service role (`src/lib/supabase/admin.ts`).
- **`product_variants.cost_price` is not readable by anon/authenticated** (column-level grant). Select variant columns explicitly (`select('id, sku, title, option1, …')`); `select('*')` or `product_variants(*)` embeds fail for those roles. Admin screens that show cost use the service role.
- Categories and collections share the URL space `/collections/<slug>`: a slug can exist in only one of the two tables (trigger `catalog_slug_guard`). Products live at `/products/<slug>`.
- Renaming a product/category/collection slug writes a 301 into `redirects` (old → new, older redirects repointed, no chains). PDP lookup: `products.slug = $1`, else `redirects.from_path = '/products/' || $1`.
- Errors raised by RPCs/triggers use the message as a stable code (`insufficient_stock`, `slug_taken: …`, `variant_options_mismatch: …`); `detail` carries JSON where useful.

## Migrations

| File | Contents |
|---|---|
| 0001_extensions_enums | pg_trgm, all enums, `set_updated_at()`, `immutable_array_to_string()`, `is_service_role()` |
| 0002_identity_rbac | profiles, permissions + role map (== `src/backend/_core/permissions.ts`), staff_members, `auth_role()`, `has_permission()`, JWT hook |
| 0003_catalog | categories, collections, products, collection_products, product_variants, product_media, inventory, reservations, movements, attributes, related_products, wishlist |
| 0004_cart_checkout | addresses, shipping zones/methods, carts, cart_items, checkout_sessions |
| 0005_orders_payments | orders, order_items, status history, payment_gateways (seeded), payments, payment_attempts, payment_events, refunds |
| 0006_shipping_returns | shipments, shipment_items, shipment_events, return_requests, return_items, return_evidence |
| 0007_reviews | reviews, review_media, review_votes |
| 0008_marketing_offers | coupons, offers, discount_targets, redemptions, campaigns, testimonials |
| 0009_content_seo_blog | content_pages, faqs, lookbook, blog, seo_overrides, redirects |
| 0010_analytics_support | visitor_sessions, analytics_events (monthly partitions), support tickets |
| 0011_settings_integrations | store_settings (singleton), integration_configs, notification_log |
| 0012_home_content | home_sections |
| 0013_audit | audit_logs + audit triggers |
| 0014_functions_triggers | catalog triggers, inventory primitives, review/return/blog/settings guards |
| 0015_commerce_rpcs | pricing, place_order, payments, cancel/expiry, refunds, tracking, journey, pg_cron |
| 0016_rls_policies | policies + grants |
| 0017_storage | buckets + object policies |
| 0018_admin_product_upsert | `admin_upsert_product(p_doc)` |

## Catalog model

**products**: `category_id` (leaf or parent), `name`, `slug` (unique), `brand`, `short_description`, `description` (markdown), `highlights text[]`, `specifications jsonb` = `[{group?, label, value}]` (validated by trigger), `tags text[]`, `badges text[]`, `option_names text[]` (0–3, e.g. `{Color,Size}`, `{Storage,Color}`, `{Weight}`, `{}`), optional `size_chart jsonb`, `weight_grams`, `length_mm/width_mm/height_mm`, `hsn_code`, `country_of_origin`, `warranty`, `returnable`, `return_window_days` (null = store default), `return_policy`, `status`, `published_at` (auto), `is_featured`, `sort_order`, SEO (`seo_title ≤70`, `seo_description ≤170`, `og_image_url`, `canonical_url`, `noindex`).
Trigger-maintained: `price_min`, `price_max`, `compare_at_min` (non-disabled variants), `rating_avg`, `review_count` (approved reviews). Marketing overrides `rating_override numeric(2,1)`, `review_count_override int`; **the storefront reads generated `rating_display` / `review_count_display`** (override when set). `search_vector` = name (A) + brand/tags (B) + short_description/highlights (C) + description (D).
Changing the *number* of `option_names` is blocked once variants exist (`option_names_locked`).

**product_variants**: one per option combination. `option1..3` are filled in `option_names` order, with exactly `cardinality(option_names)` non-null. `title` is derived (`'Black / M'`, `'Default'` when there are no options). `sku` unique `^[A-Z0-9][A-Z0-9-]{2,63}$`, `barcode` unique, `color_hex` (swatch), `price`, `compare_at_price > price`, `cost_price`, `weight_grams` (override), `low_stock_threshold` (null = `store_settings.low_stock_default`), `status active|out_of_stock|disabled` (active↔out_of_stock follows stock automatically), `position`. Unique `(product_id, option1, option2, option3)`. A trigger creates the inventory row.

**product_media**: `url`, `alt`, `position`, `is_primary` (one per product), optional `variant_id` (exact variant) or `option_value` (every variant with that option value, e.g. `Black`). Line images resolve variant → option_value → primary.

**categories**: tree via `parent_id`; `image_url/alt`, `banner_url/alt`, `description`, `is_active`, `show_on_home`, `sort_order`, SEO. `category_path(id)` = ancestors incl. self; `category_descendants(id)` = self + descendants (PLP of a parent).
**collections**: manual membership in `collection_products(collection_id, product_id, position)`; `image/banner`, `description`, `show_on_home`, `sort_order`, `is_active`, `starts_at/ends_at` (public RLS hides them outside the window), SEO. Deleting a collection cascades its membership rows only.

Other catalog tables: `attributes/attribute_values/product_attribute_values` (filter facets), `related_products(relation_type related|similar|frequently_bought_together|accessory)`, `wishlist_items`.

## Commerce tables (key columns)

| Table | Notes |
|---|---|
| cart_items | `quantity 1..10`; trigger snapshots `unit_price_snapshot`, `variant_title`, `options [{name,value}]` (display only) |
| checkout_sessions | unique `idempotency_key`, contact/address, `quote`, `order_id` |
| orders | immutable money snapshot (`subtotal, discount_total, shipping_total, cod_fee, tax_total, total`, CHECK on the math), `status`, `payment_status`, `payment_provider` (follows the latest online attempt), `tracking_token`, `pricing_snapshot`, `applied_discounts` |
| order_items | `sku, product_name, brand, variant_title, options jsonb, hsn_code, return_window_days (0 = not returnable), image_url, unit_price, compare_at_price, quantity, line_subtotal, discount_allocated, line_total` |
| payments | one per (order, provider): `amount, amount_captured, amount_refunded`, `provider_order_id`, `provider_payment_id` (unique per provider), `last_failure_stage/code/reason`, `authorized_at/captured_at/failed_at`. Partial unique: one successful payment per order |
| payment_attempts | every try: `attempt_no, status, method, amount, provider_order_id, provider_payment_id, failure_stage/source/code/reason, method_details, raw_request, raw_response, client_ip, user_agent, started_at, checkout_opened_at, completed_at`. Partial unique: one authorized/captured attempt per order; a late second capture becomes `duplicate` |
| payment_events | every webhook/callback: **UNIQUE (provider, provider_event_id)** (insert with `onConflict … ignoreDuplicates` to dedupe), `event_type, source, signature_valid, payload, processing_status received|processed|ignored|failed, processing_error, received_at, processed_at` |
| refunds | `amount, reason, status pending|processing|processed|failed, provider_refund_id (unique), idempotency_key (unique), attempt_id (duplicate-capture refunds), return_request_id, failure_code/reason, raw_request/raw_response, processed_at, failed_at` |
| discount_targets | coupon **or** offer × exactly one of `product_id / variant_id / category_id (descendants match) / collection_id`, `mode include|exclude` (no include rows = everything; exclude wins) |
| coupons | `type percent|fixed|free_shipping`, `value`, `min_order_amount`, `max_discount_amount`, `usage_limit_total`, `usage_limit_per_user` (matched by user_id or email), `first_order_only`, `combinable_with_offers`, `starts_at/ends_at`, `status` |
| reviews | `rating 1..5, title, body, author_name, author_location, source customer|admin|import, status, verified_purchase, helpful counts`. Customer rows are forced to `pending`/`customer` and verified is computed from a delivered order. `admin`/`import` rows (reviews.moderate or service role) keep every field as given |
| review_media | `storage_path` (review-media bucket) **or** `url`, `alt`, `sort_order` |
| home_sections | see below |

## RPCs (exact signatures)

Grants: `anon` + `authenticated` get the helpers and tracking; `authenticated` also gets quote_cart, apply_coupon, get_customer_journey, cancel_order, adjust_inventory, restock_return and admin_upsert_product (each re-checks ownership or permission). Everything else is service role only.

| Signature | Returns | What it does |
|---|---|---|
| `compute_pricing(p_items jsonb, p_coupon_code text = null, p_user_id uuid = null, p_email text = null, p_shipping_method_id uuid = null, p_payment_provider payment_provider = null, p_state text = null, p_lock boolean = false)` | jsonb | Price authority. `p_items = [{variantId, quantity}]`. Returns `{valid, errors[], currency, lines[], subtotal, offerDiscount, couponDiscount, discount, shipping, codFee, tax, taxRate, taxInclusive, total, appliedCoupon, coupon{id,code,type,valid,error,discount,freeShipping}, appliedDiscounts[], offerNudges[{offerId,message,itemsNeeded}], shippingMethod{id,code,name,rate,minDays,maxDays}}`. `lines[] = {variantId, productId, categoryId, sku, name, brand, slug, variantTitle, options[{name,value}], image, unitPrice, compareAtPrice, quantity, maxQuantity, lineSubtotal, discount, lineTotal, hsnCode, returnWindowDays}`. Line errors: `variant_not_found|unavailable|invalid_quantity|insufficient_stock`; coupon errors: `coupon_not_found|coupon_inactive|coupon_not_started|coupon_expired|coupon_usage_limit_reached|coupon_already_used|coupon_first_order_only|coupon_min_order_not_met|coupon_not_applicable` |
| `quote_cart(p_cart_id uuid, p_shipping_method_id uuid = null, p_payment_provider payment_provider = null, p_state text = null)` | jsonb | compute_pricing for a stored cart (owner or service) |
| `apply_coupon(p_cart_id uuid, p_code text)` | jsonb | Validates and stores the code on the cart (`null` clears it); returns the quote |
| `place_order(p_idempotency_key text, p_payload jsonb)` | jsonb | Idempotent. Payload `{userId?, email, phone, customerName?, shippingAddress{name,phone,line1,line2?,city,state,postalCode,country}, billingAddress?, items?[{variantId,quantity}] or cartId, checkoutSessionId?, couponCode?, shippingMethodId?, paymentProvider, notes?, customerIp?, userAgent?, visitorSessionId?}`. Locks stock rows, prices with `p_lock`, snapshots lines, **reserves stock** (TTL = `reservation_ttl_minutes`; COD has none), reserves coupon/offer redemptions and creates the `payments` row. COD and zero-total orders are confirmed immediately. Returns `{orderId, orderNumber, status, paymentStatus, paymentProvider, total, trackingToken, paymentId, replayed}`. Raises `empty_cart`, `invalid_payload`, `pricing_invalid` (detail = errors), `coupon_invalid` |
| `start_payment_attempt(p_order_id uuid, p_provider payment_provider, p_provider_order_id text = null, p_method payment_method = null, p_raw_request jsonb = null, p_client_ip inet = null, p_user_agent text = null)` | jsonb | New try `{attemptId, paymentId, attemptNo, amount, currency}`; extends holds by 15 min. Raises `order_already_paid`, `order_not_payable`, `gateway_disabled`, `cod_is_confirmed_at_place_order` |
| `record_payment_failure(p_attempt_id uuid, p_stage payment_failure_stage, p_code text = null, p_reason text = null, p_source text = null, p_raw jsonb = null, p_provider_payment_id text = null)` | jsonb | `{result: recorded|already_failed|ignored_already_succeeded}`. Stock stays held until the TTL so the customer can retry |
| `mark_payment_captured(p_order_id uuid, p_attempt_id uuid, p_provider_payment_id text, p_amount integer, p_method payment_method = null, p_raw jsonb = null, p_method_details jsonb = null)` | jsonb | Idempotent capture (callback and webhook). `{result: captured|already_captured|duplicate|amount_mismatch|captured_on_cancelled_order, refundRequired, …}`. First capture **commits stock**, applies redemptions, converts the cart and moves the order to `paid` |
| `reconcile_order_payment(p_order_id uuid)` | jsonb | Repairs a half-finished capture; lists duplicate/mismatched captures that still need refunds |
| `cancel_order(p_order_id uuid, p_reason text = 'cancelled')` | jsonb | orders.write or service. Releases holds (`payment_timeout` marks them `expired`), restocks committed stock, reverses redemptions. Returns the order json + `{refundRequired, refundableAmount}` |
| `release_expired_reservations()` | integer | Cron (5 min): cancels unpaid orders whose holds expired (`payment_timeout`) and expires orphan checkout holds |
| `reserve_inventory(p_variant_id uuid, p_quantity integer, p_order_id uuid = null, p_checkout_session_id uuid = null, p_ttl interval = '30 minutes')` | uuid | Row-locked hold; raises `insufficient_stock` (detail `{variantId, available, requested}`) |
| `release_inventory(p_reservation_id uuid, p_status reservation_status = 'released')` | boolean | Idempotent release (`released` or `expired`) |
| `release_order_inventory(p_order_id uuid, p_status reservation_status = 'released')` | integer | Releases every active hold of an order |
| `commit_order_inventory(p_order_id uuid)` | integer | Holds become a sale (`on_hand` and `reserved` both drop) |
| `adjust_inventory(p_variant_id uuid, p_delta integer, p_reason inventory_reason = 'adjustment', p_note text = null, p_reference_type text = 'manual', p_reference_id uuid = null)` | inventory | inventory.write or service. Manual +/-; cannot go below reserved; reasons `reservation`, `release` and `sale` are refused |
| `admin_upsert_product(p_doc jsonb)` | jsonb `{id, slug}` | catalog.write or service. One transaction: product row, variant upsert/delete (SKU/barcode/option swaps parked on temp values), opening stock via `adjust_inventory`, media order + primary, collection membership. Option-count change rebuilds variants (stock carried by SKU). Raises `variant_has_reservations`, `unknown_variant`, `unknown_media`, `product_not_found` |
| `restock_return(p_return_request_id uuid)` | integer | returns.write or service. Restocks unrestocked items whose condition is `unused` or null. Runs automatically when a return becomes `received`; idempotent |
| `get_order_tracking(p_token text)` | jsonb | Public, safe fields: `{number, status, paymentStatus, placedAt, deliveredAt, shipTo{name,city,state,postalCode}, items[{name,variantTitle,options,quantity,image}], shipment{carrier,awb,status,eta,trackingUrl,events[]}, history[]}` |
| `get_customer_journey(p_user_id uuid, p_limit integer = 200)` | table(occurred_at, kind, summary, ref_id, detail) | journey.read. Events, orders, payment attempts, tickets |
| `variant_options(p_variant_id uuid)` | jsonb | `[{name, value}]` in option order |
| `category_path(p_category_id uuid)` / `category_descendants(p_category_id uuid)` | uuid[] | Ancestors incl. self / self + descendants |
| `discount_target_match(p_coupon_id uuid, p_offer_id uuid, p_product_id uuid, p_variant_id uuid, p_category_path uuid[], p_collection_ids uuid[])` | boolean | Internal targeting rule |
| `confirm_order_side_effects(p_order_id uuid)`, `order_json(o orders)`, `order_status_allowed(p_from order_status, p_to order_status)` | void / jsonb / boolean | Internal helpers |
| `publish_scheduled_posts()`, `ensure_analytics_partition(p_month date)` | integer / text | Cron |
| `has_permission(p_permission text)`, `auth_role()`, `is_staff()`, `is_service_role()`, `bootstrap_super_admin(p_email text)`, `custom_access_token_hook(event jsonb)` | | RBAC |

## State machines

**Inventory.** `inventory.available = on_hand - reserved`, with CHECKs `on_hand >= 0`, `reserved >= 0` and `on_hand - reserved >= 0`. Every change locks the row `FOR UPDATE` and writes `inventory_movements` with a `reason` and `reference_type/reference_id`.

| Event | on_hand | reserved | reservation | ledger reason / ref |
|---|---|---|---|---|
| `place_order` | – | +q | `active` (TTL; COD none) | `reservation` / order |
| capture (`mark_payment_captured`) or COD placement | −q | −q | `consumed` | `sale` / order |
| cancel before capture | – | −q | `released` | `release` / order |
| TTL expiry sweeper | – | −q | `expired` | `release` / order |
| payment failure | – | – | stays `active` (retry until TTL) | – |
| cancel after capture | +q | – | `released` | `cancellation` / order |
| return `received` (condition unused or null) | +q | – | – | `return` / return |
| admin adjust / seed | ±d | – | – | `adjustment`, `restock`, `damage`, `correction` or `initial` / manual or import |

**Order.** `pending_payment → paid | processing (COD) | cancelled`; `paid → processing | cancelled | refunded`; `processing → packed | shipped | cancelled`; `packed → shipped | cancelled`; `shipped → delivered | cancelled`; `delivered → return_requested | refunded`; `return_requested → returned (return received) | delivered (all returns rejected) | refunded`; `returned → refunded`; `cancelled → refunded`. Enforced by `orders_before_update`; every change is logged in `order_status_history`. COD payment is captured on `delivered`.

**Payment** (`payments.status` / `orders.payment_status`): `initiated → failed → initiated (retry) → captured → partially_refunded → refunded`. Attempts: `created → failed | cancelled | captured | duplicate` (a failed attempt can still become `captured` on a late success webhook). An amount mismatch marks the attempt `failed/amount_mismatch` and requires a refund.

**Refund.** Insert as `pending` (guard: the sum of non-failed refunds ≤ captured, or ≤ the duplicate attempt's amount) → `processing` → `processed` (terminal; updates `payments.amount_refunded/status`, moves the order to `refunded` when full and the return to `refunded`) or `failed`.

**Return.** `requested → approved | rejected → pickup_scheduled → received (restock, order → returned) → refunded → closed`. Customer guard: own delivered order, per-item `order_items.return_window_days` (0 = not returnable), quantity ≤ bought.

## Home page (`home_sections`)

Columns: `id, type home_section_type, title, subtitle, config jsonb, sort_order, is_active, starts_at, ends_at, updated_by`. Public read = active and inside the window; `content.write` edits. Config shapes (validate with zod; unknown ids are skipped at render):

| type | config |
|---|---|
| `hero_carousel` | `{autoplayMs?, slides: [{image, imageAlt, mobileImage?, eyebrow?, heading, body?, cta?: {label, href}, secondaryCta?, theme?: 'light' or 'dark'}]}` |
| `category_grid` | `{categoryIds?: uuid[], limit?}` (empty → categories with `show_on_home`) |
| `collection_rail` | `{collectionIds?: uuid[], limit?}` (empty → collections with `show_on_home`) |
| `product_carousel` | `{source: 'collection' or 'category' or 'featured' or 'new' or 'best_rated' or 'manual', collectionId?, categoryId?, productIds?, limit?, cta?}` |
| `floating_showcase` | `{productIds: uuid[], image?, imageAlt?, cta?}` |
| `promo_banner` | `{image, imageAlt, heading, body?, couponCode?, cta?, theme?}` |
| `testimonials` | `{limit?, testimonialIds?}` |
| `blog_rail` | `{limit?, categorySlug?}` |
| `newsletter` | `{heading, body?, placeholder?, buttonLabel?, consentText?}` |

## Storage buckets

Public read, staff write: `product-media`, `category-media`, `collection-media` (catalog.write) and `content-media` (content.write or blog.write). Private: `review-media` (owner `<uid>/…` and moderators; public once the review is approved) and `return-evidence` (owner + returns.read).

## Seed IDs (`supabase/seed.sql`)

| Entity | Pattern |
|---|---|
| categories | `10000000-0000-4000-8000-0000000000NN`: 01 electronics, 02 home-kitchen, 03 beauty, 04 fashion, 05 books, 06 grocery-gourmet; children `<parent><n>` (11 smartphones, 12 audio, 13 computer-accessories, 14 wearables, 21–23, 31–33, 41–44, 51–53, 61–63) |
| collections | `20000000-…-00000000000N`: 1 new-arrivals, 2 best-sellers, 3 festive-gifting, 4 under-999, 5 work-from-home |
| products | `30000000-…-0000000000NN` (01–32, seed order) |
| variants | `3100PPPP-0000-4000-8000-0000000000VV`, VV = (option1 index − 1) × count(option2 values) + option2 index (1-based; single-variant products use 01) |
| media / reviews | `3200PPPP-…-0000000000MM` / `3300PPPP-…-0000000000RR` |
| offer / coupons | offer `50000000-…-01` (any 3 books for Rs 999); coupons `51000000-…-0N`: WELCOME10, FREESHIP, AUDIO15 (products), BEAUTY20 (category, excludes the makeup kit), FESTIVE500 (collection), STORAGE2K (variants) |
| home sections | `74000000-…-0000000000NN` (01–11) |
