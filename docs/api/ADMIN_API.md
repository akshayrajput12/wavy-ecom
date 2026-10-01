# wavy admin API: contract for the admin UI

Everything reads and writes Supabase. There is no demo data and no fake success.

- **Client:** `adminApi(method, path, body?)` and `mutate(method, path, body, { success, rollback? })` live in `src/views/admin/api.ts`. `path` is relative to `/api/admin/`. `body` can be JSON or `FormData`. Neither function throws. Each returns `{ ok: true, data }` or `{ ok: false, status, code, error, details }`. `mutate` shows the toasts and runs `rollback` when a call fails. Check `res.ok`.
- **Server pages:** import the getters from `@/backend/admin/repo`. Each getter re-checks the viewer's permission against `profiles` in the DB and throws `ApiError` 401 or 403 when it is missing, which the admin `error.tsx` should render. Without Supabase (no URL, anon key or service key) a getter returns its empty value (`null`, `[]` or `{items: [], total: 0}`). Every write returns **503 `supabase_not_configured`** in that case.
- **Envelope:** a success is `{ ok: true, data }`. A failure is `{ ok: false, error: { code, message, details? } }`. Status codes: 401 `unauthenticated`, 403 `forbidden`, 404 `not_found`, 409 (`conflict`, `in_use`, `slug_taken`, `sku_taken`, …), 422 `validation_error` (`details` = `{ field: [msg] }`, or a DB rule code such as `invalid_order_transition` or `refund_exceeds_captured`), 503.
- **Shapes:** response types are in `src/types/admin.ts`. Rows are DB rows with **camelCase keys** (`CamelRow<Tables<"coupons">>`). `null` stays `null`, money is integer **paise** and timestamps are ISO strings. Input types are the zod schemas in `src/backend/admin/schemas/{catalog,ops,marketing,content,settings}.ts`. Those schemas are client-safe, so use them with `zodResolver`. For optional fields: leave a key out to keep its value (PATCH) or get the DB default (create), and send `null` to clear it.
- **Every write:** permission check (JWT gate plus a DB profile re-check), zod validation, one `audit_logs` row (actor, action, entity, before and after), and `revalidateTag` on `catalog`, `home`, `content` or `settings` with `{expire: 0}`.
- **Pagination:** `?page=1&pageSize=25` (max 100). The result is `Paginated<T>` = `{items, total, page, pageSize}`.

## Routes

`P:` is the permission. `→` is the `data` shape. `[Schema]` names a zod schema.

### Catalog
| Method, path | P | Body / query → data |
|---|---|---|
| GET `products` | catalog.read | `?q&status&categoryId(descendants)&collectionId&stock=in_stock\|low\|out&page&pageSize` → `Paginated<AdminProductRow>` |
| POST `products` | catalog.write | `[ProductUpsertSchema]` → `{product: AdminProduct, priceFrom, compareAtFrom}` (201) |
| GET `products/:slug` | catalog.read | → `AdminProduct` (variants with stock, media, collectionIds) |
| PATCH `products/:slug` | catalog.write | full `[ProductUpsertSchema]` (use `toProductInput(detail)`) → as POST |
| DELETE `products/:slug` | catalog.write | `?mode=archive` (default, also needs catalog.publish) or `delete` (same rules as the bulk delete below) → `{id, mode}` (+ `{deleted, archived}` for `delete`) |
| POST `products/:slug/duplicate` | catalog.write | → as POST (draft, slug `-copy`, SKUs `-C1`) |
| PATCH `products/:slug/rating` | reviews.moderate | `{ratingOverride: 0-5\|null, reviewCountOverride: int\|null}` → rating columns |
| POST `products/bulk-status` | catalog.publish | `{ids, status}` → `{updated}` |
| GET `products/options` | catalog.read | → `{id,name,slug,status}[]` (pickers) |
| GET `slug-check` | catalog.read | `?entity=product\|category\|collection&slug&excludeId` → `{slug, available, takenBy}` (categories and collections share one URL space) |
| GET `categories` | catalog.read | → `AdminCategory[]` tree (`children`, `productCount`). `?flat=1` → `{id,name,slug,depth}[]` |
| POST `categories` | catalog.write | `[CategorySchema]` → category |
| GET/PATCH `categories/:slug` | catalog.read / write | `[CategoryPatchSchema]` (422 `category_cycle`) |
| DELETE `categories/:slug` | catalog.write | `?reassignTo=<slug>`. Without it, returns 409 `category_in_use` `{productCount, childCount}`. 409 `in_discount_rules` while a coupon/offer targets it. Children move up one level. Images are removed from `category-media` → `{id, movedProducts, movedChildren}` |
| POST `categories/reorder` | catalog.write | `{items:[{id, parentId, sortOrder}]}` → `{updated}` |
| GET/POST `collections` | catalog.read / write | → `AdminCollection[]` / `[CollectionSchema]` |
| GET/PATCH/DELETE `collections/:slug` | catalog.read / write | → `AdminCollectionDetail` (products in position order). `[CollectionPatchSchema]`. DELETE also removes the collection's membership rows (cascade) |
| POST / DELETE / PUT `collections/:slug/products` | catalog.write | `{productIds}`: POST appends, DELETE removes, PUT sets the full order → `AdminCollectionDetail` |
| POST `uploads` | per bucket | multipart `file, bucket, folder?`. `product-/category-/collection-media` need catalog.write. `content-media` needs content.write or blog.write. Mime and size are checked → `{url, path, bucket, size, contentType}`. Put `url` on the media row and `path` in `storagePath` |
| DELETE `uploads` | per bucket | `{bucket, path}` |

**Product document.** `optionNames` holds 0–3 axes. Each variant has `options` (values in the same order, `[]` when there are none), `sku` (uppercased, unique across the store), `price`, `compareAtPrice > price`, `costPrice`, `disabled` and `initialStock` (new variants only). Media are ordered by array index. One `isPrimary` is allowed (the first one wins otherwise). A media item links by `variantSku` or by `optionValue`. Variants and media without an `id` are created, and ones left out are deleted. Saves are refused with 409 `variant_has_reservations` when a removed variant still holds stock for open orders. Changing the *number* of options rebuilds every variant, and on-hand stock carries over by SKU. Any status other than draft needs catalog.publish. A failed create is rolled back. A failed update is not transactional, and the audit row keeps the full `before` document.

### Inventory
| GET `inventory` | inventory.read | `?q&filter=all\|low\|out&page` → `Paginated<AdminInventoryRow>` (onHand, reserved, available, threshold, low) |
|---|---|---|
| POST `inventory/adjust` | inventory.write | `{variantId, delta≠0, reason: restock\|adjustment\|damage\|correction\|initial\|return, note?, idempotencyKey?: uuid}` → `{replayed, inventory}` (calls `adjust_inventory`; the ledger records the staff actor. 422 `insufficient_stock` when stock would fall below reserved) |
| GET `inventory/:variantId/movements` | inventory.read | `?page` → `Paginated<AdminMovement>` (includes `actorEmail`) |

### Orders, fulfilment, returns
| GET `orders` | orders.read | `?q(number/email/phone/name)&status&paymentStatus&provider&from&to&page` → `Paginated<AdminOrderRow>` |
|---|---|---|
| GET `orders/:number` | orders.read | → `AdminOrderDetail`: items, payments, attempts, events, refunds, shipments (items, events), history, staffNotes, returns (items), `refundable`, `allowedTransitions` |
| PATCH `orders/:number` | orders.write | `{status, note?}` must follow `allowedTransitions`. `cancelled` runs `cancel_order` → `{order}` |
| POST `orders/:number/cancel` | orders.write | `{reason?}` → `{result: {refundRequired, refundableAmount, …}, order}` (releases holds, restocks, reverses redemptions) |
| GET `orders/:number/invoice` | orders.read | → `application/pdf` (issues the invoice if the order qualifies; 409 `invoice_not_ready`) |
| POST `orders/:number/invoice` | orders.write | → `{number}`: re-render the stored PDF from the frozen snapshot (same number) |
| POST `invoices` | orders.read | `{orderIds: uuid[1..200]}` or `{from, to}` (ISO, invoice `issued_at` range) → ONE `application/pdf`, one invoice per page; headers `x-invoices-count`, `x-invoices-skipped`; 422 `too_many_invoices`, 404 `no_invoices` |
| POST `orders/:number/notes` | orders.write | `{body}` → `{order}` (notes are stored as `audit_logs` `order.note` rows) |
| POST `orders/:number/refunds` | orders.refund | `{amount, reason, idempotencyKey, paymentId?, attemptId? (duplicate capture), returnRequestId?}` → `{refund, replayed}`. Creates a **pending** refund (422 `refund_exceeds_refundable`) |
| PATCH `refunds/:id` | orders.refund | `{status: processing\|processed\|failed, providerRefundId?, failureReason?}`. `processed` updates the payment, the order and the return in the DB |
| POST `orders/:number/shipments` | shipments.write | `[ShipmentCreateSchema]` (`items` defaults to every item) → `{order}` |
| PATCH `orders/:number/shipments` | shipments.write | `{id, …fields, status?, note?, location?}`. A status change writes a shipment event. `picked_up`, `in_transit` and `out_for_delivery` move the order to shipped, and `delivered` moves it to delivered → `{order}` |
| GET `returns` | returns.read | `?status&q(rma)&page` → `Paginated<AdminReturn>` (items, orderNumber) |
| PATCH `returns/:id` | returns.write | `{action:"approve", refundAmount?}` \| `{action:"reject", rejectionReason}` \| `{action:"schedule_pickup", pickupShipmentId?}` \| `{action:"receive", items:[{id, condition}]}` (the DB restocks unused items and sets the order to returned) \| `{action:"close"}` |

### Payments
| GET `payments` | payments.read | `?kind=payments\|attempts\|events&provider&status&failureStage&orderNumber&from&to&page` → `Paginated<AdminPayment\|AdminPaymentAttempt\|AdminPaymentEvent>` |
|---|---|---|
| POST `payments/reconcile` | orders.write | `{orderNumber}` → `reconcile_order_payment` json (`refundsNeeded`, `repair`, …) |
| GET `payments/gateways` | payments.read | → `AdminGateway[]` with `stats24h {attempts, captured, failed, successRate, failuresByStage}` |
| PATCH `payments/gateways/:provider` | payments.gateway.manage | `{isEnabled?, mode?, displayName?, description?, sortOrder?, minAmount?, maxAmount?, config?}`. `config` is non-secret and merged. Secret-like keys return 422 |

### Marketing and reviews
| GET/POST `coupons` | marketing.read / coupons.write | → `AdminCoupon[]` (`targets`, `stats {applied, reserved, reversed, discountGiven}`). `[CouponSchema]` |
|---|---|---|
| GET/PATCH/DELETE `coupons/:id` | marketing.read / coupons.write | `[CouponPatchSchema]`. `targets`, when sent, replaces the whole list. DELETE follows the bulk delete rules (a used coupon is archived) → `{deleted, archived}` |
| POST `coupons/bulk-status` | coupons.write | `{ids, status}` |
| GET/POST `offers`, GET/PATCH/DELETE `offers/:id` | marketing.read / offers.write | `[OfferSchema]` / `[OfferPatchSchema]`. `tiers: [{minQty, percent}]` |
| GET `reviews` | reviews.moderate | `?status&productId&source&rating&q&page` → `Paginated<AdminReview>` |
| POST `reviews` | reviews.moderate | `[ReviewSchema]` (source `admin`, status and verified flag kept as given, `createdAt` can be backdated) |
| PATCH/DELETE `reviews/:id` | reviews.moderate | `[ReviewPatchSchema]` |
| POST `reviews/moderate` | reviews.moderate | `{ids, status, note?}` → `{updated}` |

**Discount targets:** `[{mode: include|exclude, kind: product|variant|category|collection, id}]`. With no include rows the discount applies to everything. Exclude wins over include. A category also matches its descendants.

### Content and simple tables
| GET/POST `blog`, GET/PATCH/DELETE `blog/:id` | blog.write (read: blog.write or blog.publish) | `?status&q&page` → `Paginated<AdminBlogPost>`. `[BlogPostSchema]` with `tags: string[]`. `published` or `scheduled` also needs blog.publish. `readingMinutes` is computed when you leave it out |
|---|---|---|
| GET `blog/categories` | blog.write | → `AdminBlogCategory[]` |
| GET/POST `:resource`, GET/PATCH/DELETE `:resource/:id`, POST `:resource/reorder {ids}` | see below | → camelCase rows |

| resource | table | read / write P | schema | tags |
|---|---|---|---|---|
| `home-sections` | home_sections | content.write | `HomeSectionSchema` (`{type, config, title?, subtitle?, sortOrder?, isActive?, startsAt?, endsAt?}`). The config is validated per type (`HOME_CONFIG`). On PATCH `type` is fixed | home |
| `faqs` | faqs | content.write | `FaqSchema` | content |
| `testimonials` | testimonials | marketing.read or testimonials.write / testimonials.write | `TestimonialSchema` | home, content |
| `pages` | content_pages | content.write | `ContentPageSchema` | content |
| `campaigns` | campaigns | marketing.read / campaigns.write | `CampaignSchema` | home, content |
| `seo-overrides` | seo_overrides | seo.write | `SeoOverrideSchema` | content, catalog |
| `redirects` | redirects | seo.write | `RedirectSchema` | content, catalog |
| `shipping-zones` | shipping_zones | settings.read / settings.shipping.manage | `ShippingZoneSchema` | settings |
| `shipping-methods` | shipping_methods | settings.read / settings.shipping.manage | `ShippingMethodSchema` | settings |

`reorder` applies to faqs, testimonials, home-sections and shipping-methods (sets `sort_order` to the list index).

### Bulk delete

`DELETE <resource>` with body `{ids}` (1–200 uuids) → `{deleted, archived}`, 404 when no id matched. Same permission as the resource's
writes. `DELETE :resource/:id`, `coupons/:id`, `offers/:id`, `blog/:id` and `collections/:slug` run the same rules for one row.
Rules live in `src/backend/admin/remove.ts` (`REMOVABLE`); each run writes one `<entity>.delete` audit row and revalidates the resource's tags.

| resource | dependent data |
|---|---|
| `products` | Products with order items, or used by a coupon/offer target (product or variant), are **archived** (`status = archived`, also needs catalog.publish). The rest are hard-deleted: variants, stock, media, reviews, wishlist and collection rows cascade; files leave `product-media` / `review-media` |
| `categories` | 409 `category_in_use` (lists names and counts) while any has products; 409 `in_discount_rules` while a coupon/offer targets one. Child categories move to the nearest surviving ancestor. Images leave `category-media` |
| `collections` | 409 `in_discount_rules` while targeted. Membership and campaign links cascade; products stay. Images leave `collection-media` |
| `coupons` / `offers` | Redeemed ones (or coupons referenced by an order) are **archived**; the rest are deleted with their targets |
| `blog`, `faqs`, `pages`, `testimonials`, `home-sections`, `campaigns`, `seo-overrides`, `redirects` | Hard delete (tag links, campaign product/collection links cascade) |
| `shipping-methods` | Methods used by orders are **switched off** (`is_active = false`); `archived` counts them |
| `shipping-zones` | 409 `default_zone` for the default zone. Zones whose methods are used by orders are switched off; the rest are deleted with their methods |

Orders, payments, refunds, invoices, customers, staff and the audit log have no delete: they are financial, legal or security records.

### Customers, staff, settings, insights
| GET `customers` | customers.read | `?q&status&page` → `Paginated<AdminCustomerRow>` (orders, lifetimeValue, lastOrderAt) |
|---|---|---|
| GET `customers/:id` | customers.read | → `AdminCustomerDetail` (addresses, orders, tickets, `journey` from `get_customer_journey`, or `null` without journey.read) |
| PATCH `customers/:id` | customers.write | `{status: active\|blocked}` (customers only) |
| GET/POST `staff` | staff.manage | → `AdminStaff[]`. `{email, fullName?, role}` invites the person, or re-sends a pending invite |
| PATCH/DELETE `staff/:id` | staff.manage | `{role?, status?: active\|suspended, suspendedReason?, fullName?}`. You cannot change your own role or status. DELETE demotes the account to customer |
| GET `settings` | settings.read | → `AdminStoreSettings` |
| PATCH `settings/general\|tax\|shipping` | settings.write / settings.tax.manage / settings.shipping.manage | `SETTINGS_SECTIONS[section].schema` |
| GET `integrations`, PATCH `integrations/:id` | settings.read / integrations.manage | `{isActive?, environment?, status?, config?}` (config is non-secret and merged) |
| GET `audit-log` | audit.read | `?entityType&entityId&actorId&action(prefix)&from&to&page` → `Paginated<AdminAuditEntry>` |
| GET `dashboard` | any staff | → `AdminDashboard {kpis[], recentOrders, lowStock}`. Sections are filtered by the viewer's permissions |
| GET `analytics` | analytics.read | `?from&to` (default: the last 30 days) → `AdminAnalytics` (totals, daily series in the store timezone, byStatus, byProvider, topProducts, funnel) |
| GET `me` | any staff | → `StaffSession & {permissions}` |

## Repo getters (`@/backend/admin/repo`)

The empty value is what a getter returns without Supabase.

| Getter | Returns (empty) |
|---|---|
| `listProducts(q: ProductListQuery)` | `Paginated<AdminProductRow>` |
| `getProduct(slug)` | `AdminProduct \| null` |
| `listProductOptions()` | `{id,name,slug,status}[]` |
| `listCategoryTree()` / `listCategoryOptions()` / `getCategory(slug)` | `AdminCategory[]` / `{id,name,slug,depth}[]` / `AdminCategory \| null` |
| `listCollections()` / `getCollection(slug)` | `AdminCollection[]` / `AdminCollectionDetail \| null` |
| `listInventory(q)` / `listMovements(variantId, q)` | `Paginated<AdminInventoryRow>` / `Paginated<AdminMovement>` |
| `listOrders(q)` / `getOrder(number)` | `Paginated<AdminOrderRow>` / `AdminOrderDetail \| null` |
| `listReturns(q)` | `Paginated<AdminReturn>` |
| `listPayments(q)` / `listGateways()` | `Paginated<…>` / `AdminGateway[]` |
| `listCoupons()` / `getCoupon(id)` / `listOffers()` / `getOffer(id)` | `AdminCoupon[]` / `\| null` / `AdminOffer[]` / `\| null` |
| `listReviews(q)` | `Paginated<AdminReview>` |
| `listBlogPosts(q)` / `getBlogPost(id)` / `listBlogCategories()` | `Paginated<AdminBlogPost>` / `\| null` / `AdminBlogCategory[]` |
| `listHomeSections()`, `listFaqs()`, `listTestimonials()`, `listCampaigns()`, `listContentPages()`, `listSeoOverrides()`, `listRedirects()`, `listShippingZones()` (with `methods`), `getResource(name, id)` | typed rows `[]` / `null` |
| `listCustomers(q)` / `getCustomer(id)` / `listStaff()` | `Paginated<AdminCustomerRow>` / `AdminCustomerDetail \| null` / `AdminStaff[]` |
| `getCurrentStaff()` | `StaffSession \| null` (DB-verified, never throws) |
| `getStoreSettings()` / `listIntegrations()` / `listAuditLog(q)` | `AdminStoreSettings \| null` / `AdminIntegration[]` / `Paginated<AdminAuditEntry>` |
| `getDashboard()` / `getAnalytics(q)` | `AdminDashboard` / `AdminAnalytics` |

Query objects are the parsed zod query schemas. Pass `ProductListQuery.parse(await searchParams)` and similar. `toProductInput(product)` (from `schemas/catalog`) turns a detail into the editable PATCH document.

## Guards

`src/proxy.ts` refreshes the Supabase session. It sends visitors to `/login?next=` when they are not staff on `/admin/**` (checked from the JWT `user_role` claim) or not signed in on `/account/**`. On `/api/admin/**` it returns JSON 401 or 403 instead. The claim can lag a role change by up to 1 hour, so every getter and route re-checks the profile in the DB.
