# wavy: indexing strategy

About 450 indexes (including the ones created for PKs and uniques, and the per-partition copies of the analytics indexes). All are defined inline next to their table in `supabase/migrations/000X_*.sql`.

## Principles

1. **Every FK column is indexed.** This covers join direction, `ON DELETE` cascades and RLS `exists (…)` sub-queries such as `order_items → orders.user_id`. Nullable, sparse FKs such as `refunds.attempt_id` use **partial** indexes (`where col is not null`) to stay small.
2. **Admin lists get composites of `(status, created_at desc)`** (or `placed_at` / `updated_at`), so "filter by status, newest first, paginate" is a single index range scan.
3. **Storefront reads get partial indexes on `status = 'published'` / `is_active`.** Draft and archived rows never bloat the hot path.
4. **Work queues get narrow partial indexes on their predicate:** pending payments, active reservations by expiry, the moderation queue, scheduled posts, shipments still in transit and the webhook backlog. Each index stays about the size of the queue, not the table.
5. **Search:** GIN on generated `tsvector` for full-text, and `pg_trgm` GIN (`extensions.gin_trgm_ops`) for `ILIKE '%…%'` search boxes such as name, SKU, email, order number and coupon code.
6. **Idempotency and integrity are unique indexes:** `idempotency_key`, `(provider, provider_event_id)`, one successful payment per order, `coupon_redemptions.order_id`, one default address, one active cart.
7. **High-volume append tables use BRIN on time plus a few btree composites:** `analytics_events` (monthly partitions), `inventory_movements`, `payment_events`, `audit_logs`, `visitor_sessions`.
8. **Don't over-index write-heavy tables.** `analytics_events` has no GIN on `properties`. Hot keys (`product_id`, `order_id`) are copied into real columns instead.

## Query → index map

### Storefront
| Query | Index |
|---|---|
| PDP by slug `products where slug = $1` | `products_slug_key` (unique) |
| PLP by category (incl. children: `category_id = any(category_descendants($1))`) | `products_published_cat_idx (category_id, sort_order, published_at desc) where published` |
| Featured products | `products_published_featured_idx (sort_order, published_at desc) where published and is_featured` |
| Newest by created_at | `products_published_created_idx (created_at desc) where published` |
| Brand filter `lower(brand) = $1` / brand search | `products_published_brand_idx`, `products_brand_trgm_idx` |
| Tag filter `tags @> '{wireless}'` / tag search | `products_tags_idx` GIN, `products_tags_trgm_idx` (trgm on `immutable_array_to_string(tags)`) |
| "New in" | `products_published_new_idx (published_at desc) where published` |
| Sort or filter by price | `products_published_price_idx (price_min) where published` (price range is kept in sync by trigger) |
| Top rated | `products_published_rating_idx (rating_display desc, review_count_display desc) where published` |
| Search `search_vector @@ websearch_to_tsquery('english', $q)` | `products_search_idx` GIN |
| Typo-tolerant / autocomplete `name ilike '%hood%'`, `similarity(name, $q)` | `products_name_trgm_idx` GIN trgm |
| Collection page `collection_products where collection_id=$1 order by position` | `collection_products_order_idx` |
| Which collections a product is in (offers, badges) | `collection_products_product_idx` |
| Filter by material / silhouette `product_attribute_values where attribute_value_id = any($1)` | `product_attribute_values_value_idx (attribute_value_id, product_id)` |
| Variants of a product | `product_variants_product_idx (product_id, position)` |
| Gallery | `product_media_product_idx (product_id, position)` |
| Home page sections | `home_sections_active_idx (sort_order) where is_active`; home grids `categories_home_idx`, `collections_home_idx` |
| Stock for a variant | `inventory` PK |
| PDP approved reviews, newest / most helpful | `reviews_product_approved_idx`, `reviews_product_helpful_idx` (partial, approved) |
| Active offers | `offers_active_idx (priority desc) where active` |
| Coupon lookup at checkout `upper(code) = upper($1)` | `coupons_code_uidx` (unique), `coupons_active_code_idx` (partial) |
| Offer/coupon targets | `discount_targets_offer_idx` / `_coupon_idx` partial |
| Blog index, newest | `blog_posts_published_idx (published_at desc) where published` |
| Redirect lookup in the proxy | `redirects_active_idx (from_path) include (to_path, status_code) where is_active`: index-only scan |
| SEO override for a path | `seo_overrides_path_key` (unique) |
| Public tracking `where tracking_token = $1` | `orders_tracking_token_key` (unique) |

### Customer account
| Query | Index |
|---|---|
| My orders `where user_id = auth.uid() order by placed_at desc` | `orders_user_idx (user_id, placed_at desc)` |
| Order detail lines | `order_items_order_idx` |
| My addresses / wishlist / cart | `addresses_user_idx`, `wishlist_items_user_idx`, `carts_active_user_uidx` |
| Anonymous cart by cookie | `carts_active_session_uidx (session_id) where active` |
| Verified-purchase check (trigger) | `order_items_product_idx (product_id, order_id)` + `orders_pkey` |
| Coupon per-user limit | `coupon_redemptions_user_idx (coupon_id, user_id)` / `_email_idx (coupon_id, lower(email))` partial, not reversed |

### Admin console
| Query | Index |
|---|---|
| Orders by status, newest | `orders_status_idx (status, placed_at desc)` |
| Orders by payment status | `orders_payment_status_idx` |
| Search order `wavy-1001…` / email / phone | `orders_number_trgm_idx`, `orders_email_trgm_idx`, `orders_email_idx lower(email)`, `orders_phone_idx` |
| Products by status | `products_status_idx (status, updated_at desc)` |
| SKU search | `product_variants_sku_trgm_idx` + `product_variants_sku_key` |
| Low stock report `inventory i join product_variants v … where i.available <= coalesce(v.low_stock_threshold, store default)` | `inventory_available_idx (available)` range scan |
| Stock ledger for a variant | `inventory_movements_variant_idx (variant_id, created_at desc)` |
| Customer search by email / name | `profiles_email_trgm_idx`, `profiles_name_trgm_idx`, `profiles_email_lower_uidx` |
| Staff list | `profiles_staff_role_idx where role <> 'customer'`, `staff_members_status_idx` |
| Review moderation queue | `reviews_moderation_idx (status, created_at) where pending` |
| Returns queue | `return_requests_status_idx (status, created_at desc)` |
| Shipments needing a tracking sync | `shipments_sync_idx (last_synced_at nulls first) where not delivered/cancelled` |
| AWB lookup from courier webhook | `shipments_awb_uidx` |
| Support queue | `support_tickets_queue_idx (status, priority, created_at) where open/pending_internal` |
| Tickets for an order / payment | `support_tickets_order_idx`, `support_tickets_payment_idx` |
| Audit trail for an entity | `audit_logs_entity_idx (entity_type, entity_id, created_at desc)` |
| Audit by actor | `audit_logs_actor_idx` |

### Payments and ops
| Query | Index |
|---|---|
| Webhook dedupe `insert … on conflict (provider, provider_event_id) do nothing` | `payment_events_provider_provider_event_id_key` |
| Webhook → attempt `where provider_order_id = $1` | `payment_attempts_provider_order_idx`, `payments_provider_order_idx` |
| Webhook → attempt by pay id | `payment_attempts_provider_payment_uidx (provider, provider_payment_id)` |
| All attempts for an order (support) | `payment_attempts_order_idx (order_id, started_at)` |
| Failure analytics by stage | `payment_attempts_failure_idx (failure_stage, started_at desc)`, `payments_failed_idx` |
| Duplicate captures awaiting refund | `payment_attempts_duplicate_idx where status='duplicate'` |
| Unprocessed webhooks | `payment_events_backlog_idx where received/failed` |
| Never pay twice | `payments_one_success_per_order_uidx`, `payment_attempts_one_success_per_order_uidx` (partial unique) |
| Expiry sweeper | `orders_pending_payment_idx`, `inventory_reservations_expiry_idx where active` |
| Scheduled blog publishing | `blog_posts_scheduled_idx where scheduled` |

### Analytics and customer journey
| Query | Index |
|---|---|
| Time-range dashboards `where created_at between …` | partition pruning + `analytics_events_created_brin` |
| Funnel counts by event `where event_name = $1 and created_at > …` | `analytics_events_name_idx (event_name, created_at desc)` |
| A customer's journey | `analytics_events_user_idx`, `analytics_events_session_idx`, `visitor_sessions_user_idx` |
| Product views / add-to-cart per product | `analytics_events_product_idx (product_id, event_name, created_at)` |
| Events for an order | `analytics_events_order_idx` |
| Campaign attribution | `visitor_sessions_campaign_idx (utm_campaign, first_seen_at)` |

## Partitioning

`analytics_events` is `PARTITION BY RANGE (created_at)` with one partition per month (`analytics_events_YYYY_MM`) plus a `DEFAULT` partition. The migration creates last month through 12 months ahead. `ensure_analytics_partition(date)` creates the next month. Schedule it with pg_cron (the migration does this automatically when pg_cron is installed) or with a monthly backend cron. Drop an old month instantly with `drop table analytics_events_2026_01`, or detach it for archiving. Create each partition **before** its month starts: once rows for that range land in DEFAULT, creating the partition fails until they are moved.

## Maintenance notes

- Prefix admin search with `%` only when trigram indexes exist. They do for the columns listed above.
- `products.price_min` / `rating_avg` are denormalised by triggers so that PLP sort and filter never join variants or reviews.
- Re-check with `explain (analyze, buffers)` once real data exists. Candidates to drop if unused (`pg_stat_user_indexes.idx_scan = 0` after a month): the trigram indexes on `profiles.full_name` and `coupons.code`.
