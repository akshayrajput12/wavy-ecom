# API reference (storefront + commerce backend)

Contract for UI agents. Types live in `src/types/domain.ts`; money is integer **paise**. Server Components call the backend functions directly; Client Components call the HTTP routes. Nothing is static: every domain read comes from Supabase. Without Supabase env, reads return empty values (`[]`, `null`, `{items: [], total: 0}`) and render empty states; writes return `503 backend_unavailable`.

## Conventions

- Envelope: `{ ok: true, data }` or `{ ok: false, error: { code, message, details? } }`. Malformed JSON 400, zod 422 (`details` = field errors), `ApiError` its own status, unexpected 500 (`internal_error`, with request ref).
- RPC/trigger failures surface their stable code as `error.code` (`insufficient_stock`, `pricing_invalid` + `details` = quote errors, `coupon_invalid`, `order_not_cancellable`, `return_window_closed`, `item_not_returnable`, `order_not_delivered`, `return_quantity_exceeds_purchase`, ...). Shopper text for pricing/coupon codes: `pricingErrors` in `src/data/copy.ts`.
- Auth: `requireUser()` routes return `401 unauthenticated` when signed out.
- Import paths below are relative to `src/backend/`.

## Cache tags (`_core/cache.ts`)

Public reads are wrapped in `cached()` (unstable_cache + React cache, 300 s time revalidation). After a write, call `revalidateTag(TAGS.<name>, "max")` (Next 16 two-argument form; use `updateTag` inside Server Actions for read-your-writes).

| Tag | Covers |
|---|---|
| `catalog` | products, variants, media, stock shown on PDP/PLP, categories, collections, related products, redirects, search suggestions |
| `home` | home_sections (home also depends on `catalog`, `content`, `blog`) |
| `content` | content_pages, faqs, testimonials, navigation |
| `blog` | blog posts / categories / tags |
| `reviews` | approved reviews + rating summaries |
| `settings` | store_settings, payment_gateways |
| `shipping` | shipping zones + methods |

## Server functions

### catalog (`catalog/repo.ts`, query schema `catalog/schema.ts`)

| Function | Returns |
|---|---|
| `listProducts(q: ProductQuery, withFacets = true)` | `ProductList = Paginated<Product> & { facets: Facets }` |
| `productQueryFrom(searchParams, overrides?)` (schema.ts) | `ProductQuery` from page `searchParams` or `URLSearchParams` |
| `getProductBySlug(slug)` | `Product \| null` (published only) |
| `getRedirect(fromPath)` | `string \| null`, e.g. `getRedirect("/products/old")` for 301s when the PDP is null |
| `getProductsByIds(ids: string[])` | `Product[]` in the given order (max 100) |
| `getRelatedProducts(product, limit = 8)` | `Product[]` (curated related_products, topped up from the same category) |
| `listCategories()` | `Category[]` tree (roots, each with `children`) |
| `listCategoriesFlat()` | `Category[]` flat |
| `getCategoryBySlug(slug)` | `(Category & { ancestors: CategoryRef[] }) \| null` (children populated) |
| `listCollections()` | `Collection[]` (active, in window, with `productCount`) |
| `getCollectionBySlug(slug)` | `Collection \| null` |
| `resolveCollectionOrCategory(slug)` | `{kind:"category", category} \| {kind:"collection", collection} \| {kind:"redirect", to} \| null` for `/collections/[slug]` |
| `searchSuggestions(q)` | `{ products: {id, slug, name, brand?, priceFrom, image?}[], categories: CategoryRef[], collections: {id, name, slug}[] }` |

`ProductQuery` (URL form): `category` (slug, includes descendants), `collection` (slug), `opt` (repeatable `Name:Value`, matched on value), `brand` (repeatable), `min`/`max` (paise, on `priceFrom`), `inStock=1`, `sort` (`featured|newest|price-asc|price-desc|rating`), `q` (FTS + name/brand ilike), `page` (1-based), `pageSize` (1..60, default 24). Invalid values fall back to defaults.

`Facets` (`catalog/facets.ts`) are computed over the scope (category/collection/q) ignoring refinements: `{ categories: {id, slug, name, count}[] (children of the scoped category, or roots), brands: {value, count}[], options: {name, values: {value, colorHex?, count}[]}[], price: {min, max} | null }`.

`Product` notes: `variants` exclude disabled ones; `variant.options` follow `product.optionNames`; `variant.stock` = available units; `variant.image` resolves variant > option value; `images[0]` is the primary image; `rating`/`reviewCount` are display values (override applied).

### content (`content/repo.ts`, `content/home.ts`)

| Function | Returns |
|---|---|
| `getHomeSections()` (home.ts) | `HomeSection[]`: discriminated union on `type`; resolved data on `categories` / `collections` / `products` / `testimonials` / `posts`. Invalid or empty sections are skipped |
| `listBlogPosts({ page?, pageSize? = 12, category?, tag? })` | `Paginated<BlogPost>` (no `body`) |
| `getBlogPost(slug)` | `BlogPost \| null` |
| `getRelatedPosts(post, limit = 3)` | `BlogPost[]` |
| `listFaqs()` | `Faq[]` (group by `category` in the UI) |
| `getContentPage(slug)` | `ContentPage \| null` (`blocks` = jsonb array, e.g. `{type:"hero"\|"text"\|"faq_list", ...}`) |
| `listTestimonials(limit = 12, ids?)` | `Testimonial[]` |
| `getNavigation()` | `{ categories: NavLink[] (tree), collections: NavLink[], pages: NavLink[] }`; group headings come from `footerCopy`/`headerCopy` |

Home config zod schemas: `HomeSectionConfig` in `content/schema.ts` (admin editors should validate with them).

### settings / shipping

| Function | Returns |
|---|---|
| `getStoreSettings()` (settings/repo.ts) | `StoreSettings \| null` (store name, support email/phone, free-shipping threshold, COD rules, tax) |
| `listPaymentOptions()` (settings/repo.ts) | `PaymentOption[]` enabled gateways (COD hidden when disabled in settings) |
| `listShippingMethods(state?)` (shipping/repo.ts) | `ShippingMethod[]` for the state's zone (else default zone); all when no state |
| `checkServiceability(pincode)` (shipping/serviceability.ts) | `{ serviceable, prepaidAvailable, codAvailable, estimatedDays }` (Shiprocket; 503 when unconfigured) |

### reviews (`reviews/repo.ts`)

| Function | Returns |
|---|---|
| `listProductReviews(productId, { page?, pageSize? = 10, sort? = recent\|helpful\|high\|low, rating? })` | `Paginated<Review> & { summary: RatingSummary }` |
| `submitReview(session, SubmitReviewInput)` | `{ id, status: "pending", verifiedPurchase }` |
| `voteReview(session, reviewId, helpful)` | `void` |

### pricing / checkout / payments

| Function | Returns |
|---|---|
| `quoteCart(QuoteInput, session \| null)` (pricing/service.ts) | `CartQuote` |
| `validateCoupon(CouponInput, session \| null)` | `{ coupon: QuoteCoupon, quote: CartQuote }` |
| `placeOrder(CheckoutInput, idempotencyKey, session, ctx)` (checkout/service.ts) | `{ order: PlacedOrder, payment: PaymentInstructions }` |
| `retryPayment(orderId, { trackingToken?, userId? }, ctx)` (payments/service.ts) | `PaymentInstructions` |
| `verifyRazorpayPayment(VerifyInput)` | `{ result: captured\|already_captured\|duplicate\|amount_mismatch\|captured_on_cancelled_order, refundRequired, orderId, orderNumber? } \| { result: "failed", orderId }` |
| `reportPaymentFailure(FailureInput)` | `{ result: recorded\|already_failed\|ignored_already_succeeded }` |
| `handleRazorpayWebhook(rawBody, signature, eventId)` (payments/webhook.ts) | `{ duplicate, status }` |

### orders / returns / account

| Function | Returns |
|---|---|
| `listMyOrders(session)` (orders/repo.ts) | `OrderSummary[]` |
| `getMyOrder(session, number)` | `Order \| null` (items, shipment + events, status history) |
| `getOrderForViewer(number, trackingToken?)` | `Order \| null` for the owner or a guest holding the token (checkout success / retry pages) |
| `getOrderTracking(token)` | `OrderTracking \| null` (public, no contact details) |
| `cancelMyOrder(session, number, reason?)` | `{ status, refundRequired, refundableAmount }` (only `CUSTOMER_CANCELLABLE` = pending_payment, paid, processing) |
| `listMyReturns(session)` (returns/service.ts) | `ReturnRequest[]` |
| `createReturnRequest(session, CreateReturnInput)` | `ReturnRequest` |
| `getAccountUser()` (account/repo.ts) | `AccountUser \| null` `{ id, name, email, phone, marketingOptIn, memberSince }` |
| `updateProfile(session, ProfileInput)` | `void` |
| `listAddresses / createAddress / updateAddress / deleteAddress` | `Address[]` / `Address` / `Address` / `void` |
| `listWishlist(session)` | `{ items: {productId, variantId?}[], products: Product[] }` |
| `addToWishlist / removeFromWishlist(session, { productId, variantId? })` | `void` |

Session helpers: `getSession()`, `requireUser()` in `_core/auth.ts`.

### invoices (`invoices/service.ts`, `invoices/access.ts`; migration `0021_invoices.sql`)

GST tax invoice per order, issued automatically: prepaid when the payment is captured (verify callback or webhook, idempotent), zero-total at placement, COD at dispatch (packed/shipped, GST s.31). Number `WVY/<FY>/<6-digit seq>`, gap-free per Indian financial year (April rollover, IST), allocated by `issue_invoice()` in the DB. The snapshot (seller, buyer, place of supply, lines with HSN, CGST+SGST or IGST, totals, amount in words, payment) is frozen at issue; tax is the order's own `tax_total` allocated across lines, never re-priced. Credit notes / re-issue: not built.

| Function | Returns |
|---|---|
| `ensureInvoice(orderId)` | invoice row; issues it if the order qualifies, else `409 invoice_not_ready` |
| `invoiceIfReady(orderId)` | `Invoice \| null` (never throws; issues if eligible) |
| `getInvoicePdf(orderId)` | `{ pdf: Buffer, number, filename }` (stored PDF, rendered on first use). Email-ready |
| `regenerateInvoicePdf(orderId)` | `{ number }` re-render from the frozen snapshot |
| `bulkInvoicesPdf({orderIds} \| {from, to})` | `{ pdf, count, skipped }` one invoice per page, max 200 |
| `guestInvoiceOffer(number, trackingToken)` | success page, signed out: `{state: "ready", invoice, href}` (href signed, 30 min) \| `{state: "pending_payment" \| "on_dispatch"}` \| `null` |

## HTTP routes

| Method | Path | Request | Response `data` |
|---|---|---|---|
| GET | `/api/products` | `ProductQuery` as query string | `ProductList` |
| GET | `/api/search/suggest?q=` | | `SearchSuggestions` |
| GET | `/api/reviews?productId=&page=&pageSize=&sort=&rating=` | | `ReviewPage` |
| POST | `/api/reviews` (auth) | `{ productId, rating 1..5, title 2..120, body 10..4000, authorName, authorLocation? }` | `201 { id, status, verifiedPurchase }`; `409` if already reviewed |
| POST | `/api/reviews/:id/vote` (auth) | `{ helpful: boolean }` | `{ voted: true }` |
| POST | `/api/cart/quote` | `{ items: [{variantId, quantity 1..10}] (max 50), couponCode?, shippingMethodId?, paymentProvider?, state?, email? }` | `CartQuote` |
| POST | `/api/cart/coupon` | quote body with required `couponCode` | `{ coupon, quote }` |
| GET | `/api/shipping/methods?state=` | | `ShippingMethod[]` |
| GET | `/api/shipping/serviceability?pincode=` | | `Serviceability` |
| POST | `/api/checkout` | header `Idempotency-Key` (8..200, reuse on retry of the same submit); body `{ email, phone, customerName?, shippingAddress: {name, phone, line1, line2?, landmark?, city, state, postalCode, country="IN"}, billingAddress?, items, couponCode?, shippingMethodId?, paymentProvider: "razorpay"\|"cod", notes?, saveAddress? }` | `201 { order, payment }` (`200` when replayed) |
| POST | `/api/payments/razorpay/verify` | `{ orderId, attemptId, razorpayOrderId, razorpayPaymentId, razorpaySignature }` | capture result (above) |
| POST | `/api/payments/razorpay/retry` | `{ orderId, trackingToken? }` | `PaymentInstructions` |
| POST | `/api/payments/failure` | `{ attemptId, stage?, code?, reason?, description?, razorpayPaymentId? }` | `{ result }` |
| POST | `/api/webhooks/razorpay` | raw Razorpay body; headers `X-Razorpay-Signature`, `X-Razorpay-Event-Id` | `{ duplicate, status }` |
| GET | `/api/orders/track?token=` | | `OrderTracking` (404 when unknown) |
| GET | `/api/orders/:number/invoice` (owner, or guest `?t=`) | `t` = signed link from the success page (expires after 30 min) | `application/pdf`; `401` signed out without `t`, `404` not yours, `403 invoice_link_expired`, `409 invoice_not_ready` |
| POST | `/api/orders/:number/cancel` (auth) | `{ reason? }` | `{ status, refundRequired, refundableAmount }` |
| GET / POST | `/api/returns` (auth) | POST `{ orderNumber, reason: ReturnReason, resolution?=refund\|exchange\|store_credit, customerNote?, items: [{orderItemId, quantity, reason?}] }` | `ReturnRequest[]` / `201 ReturnRequest` |
| GET / POST | `/api/account/addresses` (auth) | POST `Address` fields (+ `isDefault?`, `label?`) | `Address[]` / `201 Address` |
| PATCH / DELETE | `/api/account/addresses/:id` (auth) | PATCH partial address | `Address` / `{ deleted: true }` |
| GET / PATCH | `/api/account/profile` (auth) | PATCH `{ fullName?, phone?, marketingOptIn? }` | `AccountUser` |
| GET / POST / DELETE | `/api/account/wishlist` (auth) | POST/DELETE `{ productId, variantId? }` | wishlist / `{ saved }` / `{ removed }` |

### Checkout + payment flow

1. Bag UI: `POST /api/cart/quote` on every change; show `lines`, `errors` (per `variantId`), `offerNudges`, totals. Client prices are display-only.
2. `POST /api/checkout` with a fresh `Idempotency-Key` (keep it for retries of the same submit).
   - `payment.provider === "none"`: COD or zero total, the order is confirmed; go to `/checkout/success/<order.number>?token=<order.trackingToken>`.
   - `payment.provider === "razorpay"`: open Razorpay Checkout with `{ key: keyId, order_id: razorpayOrderId, amount, currency, name, prefill }`. On `handler(resp)` POST `/verify` with `orderId`, `attemptId` and the three `razorpay_*` values. On `payment.failed` / modal dismiss POST `/api/payments/failure` (`stage: "user_cancelled"` on dismiss). Retry = `POST /api/payments/razorpay/retry` (new attempt; never double-charges, stock stays held until the TTL).
   - If the gateway order cannot be created you get `502 gateway_error` with `details.order`; offer retry with that order id + trackingToken.
3. The webhook confirms payments even when the browser never returns. `verify` returning `payment_pending` (409) means wait/poll `getOrderForViewer`.

`PaymentInstructions`: `{ provider: "none", orderId, orderNumber } | { provider: "razorpay", orderId, orderNumber, attemptId, keyId, razorpayOrderId, amount, currency, name, prefill: {name, email, contact} }`.

## Environment

`INVOICE_LINK_SECRET` (optional; HMAC key for guest invoice links, else derived from the service-role key), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (reads), `SUPABASE_SERVICE_ROLE_KEY` (pricing, checkout, payments, webhooks, guest order view), `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `SHIPROCKET_API_EMAIL`, `SHIPROCKET_API_PASSWORD`, `SHIPROCKET_PICKUP_POSTCODE`, `NEXT_PUBLIC_SITE_URL`.

## Not built

PayU adapter (checkout rejects `payu` with `422 gateway_unavailable`), return evidence upload endpoint (upload to the `return-evidence` bucket from the client, path `<uid>/<returnId>/<file>`), review photo upload, newsletter signup (no table), server-side guest carts (`carts`/`quote_cart` unused: the bag is client state quoted via `/api/cart/quote`), customer-initiated refunds (cancel flags `refundRequired`; staff issue refunds).
