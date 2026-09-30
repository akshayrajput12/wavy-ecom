# Stitch Screens → Routes

Source: Stitch project **11414759065021159242** ("FORM/01 Fashion Commerce System"), 32 screens plus
1 logo asset. The designs still carry the old **FORM/01** brand and copy. When building a
screen, take the **layout and section order** from Stitch, the copy from `src/data/*`, and the tokens
from `DESIGN_SYSTEM.md`. Stitch's own utility classes (`font-headline-lg`, `bg-surface-container`…)
map to our tokens and must not be copied verbatim.

Resource name format: `projects/11414759065021159242/screens/<id>`. Numbers follow
`docs/specs/04_wavy_Screen_Catalogue_and_Traceability.md`.

## 1. Storefront (desktop)

| # | Stitch title | Screen id | Route | View folder |
|---|---|---|---|---|
| 01 | 01. Home / Desktop | `c201d40d4ef14087a5252806aa2bf0ad` | `/` | `views/home` |
| 03 | 03. Collection / Clothing | `1422e02695bd4aa5a6b98c8babdcbcb1` | `/clothing` (also `/collections/[slug]`) | `views/collection` |
| 04 | 04. Collection / Sneakers | `d12750bdaf7843b9901f131fe1caa4e8` | `/sneakers` | `views/collection` (footwear filter preset) |
| 08 | 08. Product / Default | `8a068fb107b9466eb875c6b9b5896c40` | `/products/[slug]` | `views/product` |
| 13 | 13. Wishlist | `ced74cf212884f4bb07b361921b742cd` | `/wishlist` | `views/wishlist` |
| 14 | 14. Cart / Drawer | `ef9179066c984fb49a46cf20e54a0cf0` | global overlay | `components/commerce/CartDrawer` (used by every storefront view) |
| 15 | 15. Cart / Full Page | `c0038932d26d4fe5945bc4851a3c08f9` | `/cart` | `views/cart` |
| 38 | 38. Help / FAQ | `e4089974aa1b4ce6943ad188c399ee29` | `/faq` | `views/faq` |
| 40 | 40. Journal / Lookbook | `15a673907bc34e89847976d3ab023716` | `/journal` (index), `/lookbook` | `views/journal` |

## 2. Checkout and post-purchase

| # | Stitch title | Screen id | Route | View folder |
|---|---|---|---|---|
| 16 | 16. Checkout / Contact | `8de0511a7c81420bba91180e1f311dc9` | `/checkout/contact` | `views/checkout` (step `contact`) |
| 17 | 17. Checkout / Address | `cf8220a130524d3cb80fe5eb970c6fe2` | `/checkout/address` | `views/checkout` (step `address`) |
| 18 | 18. Checkout / Shipping | `7f7831a02e9347dcb4f5a8ed2620af5c` | `/checkout/shipping` | `views/checkout` (step `shipping`) |
| 19 | 19. Checkout / Payment | `432f92b391dc448f98574660b5c8c9eb` | `/checkout/payment` | `views/checkout` (step `payment`) |
| 20 | 20. Order / Success | `2261f4399aef45af8031a9a8974a5b5b` | `/order/[number]/success` | `views/order-success` |

## 3. Mobile (390 × 844 baseline)

These are the same routes and views as desktop, built responsively. Mobile is **not** a separate route.

| # | Stitch title | Screen id | Route | View folder |
|---|---|---|---|---|
| 21 | 21. Mobile / Home | `62ca1a92d98646b8b9c2484ce029babc` | `/` | `views/home` |
| 22 | 22. Mobile / Collection | `5f535ea360594736b25290f1af2cc333` | `/clothing` | `views/collection` |
| 23 | 23. Mobile / Product | `55874508ad2c4781b3b3c86902565f5a` | `/products/[slug]` | `views/product` |
| 27 | 27. Mobile / Cart | `df34a5c324da4f10b23939ac04d4b70d` | `/cart` | `views/cart` |
| 28 | 28. Mobile / Checkout | `dd81440e8b06463e92f05ea187fded1c` | `/checkout/*` | `views/checkout` (single-column stack) |

## 4. Account

| # | Stitch title | Screen id | Route | View folder |
|---|---|---|---|---|
| 31 | 31. Login | `9214cb51f2124ce5b611683a58e8e164` | `/login` | `views/auth` |
| 33 | 33. Account / Overview | `3f57e1075ab4439789834451d2cd10fb` | `/account` | `views/account` |
| 34 | 34. Account / Orders | `58451674341e410bb430ae637d76f055` | `/account/orders` | `views/account-orders` |

## 5. Admin

| # | Stitch title | Screen id | Route | View folder |
|---|---|---|---|---|
| 41 | 41. Admin / Dashboard | `cff34b624d7545589f4793ea5b486c86` | `/admin` | `views/admin-dashboard` |
| 42 | 42. Admin / Products | `6bf842e3616a4c5380371ab59e55a4e0` | `/admin/products` | `views/admin-products` |
| 43 | 43. Admin / Product Editor | `7afcace2a2704f8684e75753bda24cfb` | `/admin/products/[id]` | `views/admin-product-editor` |
| 44 | 44. Admin / Inventory Matrix | `b32c423dbd7d4491a9d3d271b39e733c` | `/admin/inventory` | `views/admin-inventory` |
| 45 | 45. Admin / Orders | `0e206ef4c04c474d8c6eec148ed5e2a1` | `/admin/orders` | `views/admin-orders` |
| 46 | 46. Admin / Order Detail | `a29c319f891043b7b8f4b3e16e277df1` | `/admin/orders/[id]` | `views/admin-order-detail` |
| 47 | 47. Admin / Customer Ledger & CRM | `5259cc1046b1421f864f7db83e04c569` | `/admin/customers` | `views/admin-customers` |
| 48 | 48. Admin / Review & Moderation | `5c0e2b1c1d444a25885f17fed1121d00` | `/admin/reviews` | `views/admin-reviews` |
| 51 | 49. Admin / Coupons & Allocations | `1109d17f3402435e834d842b9a1feadc` | `/admin/marketing/coupons` | `views/admin-coupons` |

In Stitch this screen is numbered **49**, but it is catalogue **#51 Coupons**. Catalogue #49 (Review Composer) has no Stitch screen.

## 6. Asset

| Stitch title | Screen id | Use |
|---|---|---|
| FORM/01 Brand Logo | `ebb434671faa4fd98a8bb143d9dc890c` (SVG, 512²) | Old brand. Replace with the wavy wordmark in `public/brand/`. Keep it only as a reference for sizing. |

## 7. Layout notes: sections in order

Every storefront screen ends with the global footer (Manifesto/About, Customer Care, Studio &
Initiatives, Newsletter "Join"), which is `components/layout/Footer`. The header is sticky, 64 px,
translucent surface with a bottom border. It holds the brand, nav (New In, Clothing, Sneakers,
Collections, Journal), and Search, Wishlist, Account and Bag icons.

| # | Sections (top → bottom) |
|---|---|
| 04 Collection / Sneakers | 1. Hero banner + title · 2. Horizontal silhouette tabs (Runners, High, Low, Mules) + dropdowns (Size UK, Material, Price) + In Stock toggle + Sort · 3. Grid of 12, with "Quick Select Size" on hover · 4. Load remaining · 5. Tech story band + Virtual Fit CTA (aside) |
| 13 Wishlist | 1. Title + actions (Share, Clear all, Move all to bag) · 2. Grid of saved items with Move to Bag / Try It On / Notify Restock (out of stock) · 3. Empty-state variant · 4. "Pieces that complete your saved looks" rail · 5. Trust row (authenticity, alteration, packaging) |
| 14 Cart drawer | Right drawer 420 px: 1. header + item count · 2. lines (image, name, size/colour, qty stepper, wishlist, remove) · 3. upsell item with size quick-add · 4. coupon field · 5. free-shipping / offer nudge · 6. subtotal + "Proceed to Checkout ₹…" sticky footer |
| 15 Cart page | 1. Title · 2. Left: line items with qty, move to wishlist, remove; pincode delivery check · 3. Right sticky "Order Summary": coupon, subtotal/discount/shipping/GST, total, checkout CTA, accepted-method marks · 4. "Frequently Paired" rail |
| 16 Checkout / Contact | 1. Stepper (Contact → Address → Shipping → Payment) · 2. Express pay row · 3. Email + mobile fields (with helper text on why each is needed) · 4. Continue CTA · Right: order summary aside with lines + coupon |
| 17 Checkout / Address | 1. Completed step summary with Edit · 2. Address form (first/last name, pincode first → autofill city/state, street, locality, city, state) · 3. Address type chips (Home/Work/Other with delivery windows) · 4. Continue · Right: "Order summary" aside |
| 18 Checkout / Shipping | 1. Step summaries · 2. Delivery tier radio cards (Standard free over threshold, Express) with ETA from Shiprocket · 3. Delivery instructions textarea · 4. Continue · Right: summary |
| 19 Checkout / Payment | 1. Step summaries · 2. Method list: UPI, Cards, NetBanking (bank chips), COD · 3. Pay ₹… & Confirm CTA · Right: summary. **Deviation:** Stitch shows inline card/CVV and VPA inputs. We do **not** build those (PCI SAQ-A, 07 §8). Our screen lists the enabled gateways and methods, and card/UPI entry happens inside the Razorpay modal or PayU page. |
| 20 Order success | 1. Thank-you hero with order number + Download invoice · 2. "Shipment status" timeline (from `/api/track/[token]`) · 3. Items list · 4. Account / track next steps, circular-care note |
| 22 Mobile collection | 1. Compact title · 2. Sticky bar: Filters (count) button → bottom sheet, active chips, Sort · 3. 2-column grid · 4. Load more (12 of 48) · 5. Material story |
| 27 Mobile cart | 1. "Your Bag (n)" · 2. Lines with stepper + Save · 3. Delivery estimate · 4. Coupon · 5. Frequently paired rail · 6. Price breakdown · 7. Sticky checkout CTA |
| 28 Mobile checkout | Single column: 1. Express pay buttons · 2. Contact summary + Edit · 3. Delivery address form + address type · 4. Billing = shipping toggle · 5. Payment options (UPI/QR, NetBanking, cards via gateway) · 6. Price breakdown · 7. Sticky Pay CTA |
| 31 Login | Split: left editorial image with overline, right form: Google sign-in, email, password, remember me, Sign in, links to Sign up / Forgot password |
| 33 Account overview | 1. Greeting header + support shortcut · 2. Latest order card (Track shipment, View order) · 3. Active service/repair request card · 4. Brand-service perks block · 5. Support CTA · Left nav: Account, Orders, Addresses/Profile, Returns, Logout |
| 34 Account orders | 1. Status tabs (All, In transit, Delivered, Returned) · 2. Order cards: items, status badge, total, date + actions (Invoice, Track, Return/Order again) · 3. Side card: support contact + Report a problem |
| 40 Journal / Lookbook | 1. Masthead title · 2. Category tabs (Lookbooks, Material, Notes, Footwear) · 3. Featured story (large asymmetric) · 4. "Dispatches" article grid · 5. Seasonal lookbooks (4 drop cards) · 6. Newsletter signup |
| 44 Admin inventory | 1. Title + threshold setting + Rapid Adjustment · 2. Low-stock alert strip (Review all) · 3. Product selector + colour filter + consolidated vs by-location toggle · 4. Apparel matrix (colour rows × XS–XXL, available sum, restock) · 5. Footwear matrix (UK 6–12, reorder point) · 6. Adjustment drawer (SKU, type, delta, reason, Commit) |
| 45 Admin orders | 1. Title + Export manifest, Scan AWB, Print invoices · 2. Status tabs with counts (Awaiting pickup, In transit, Out for delivery, Delivered, Returns) · 3. Filters (date, payment Paid/COD, fulfilment) · 4. Table (ref/time, customer, items preview, payment, fulfilment, carrier/AWB, actions) · 5. Pagination · 6. Right queue aside (Print pending labels) |
| 46 Admin order detail | 1. Header: order #, status, Print label & AWB, GST invoice, Actions menu · 2. Items · 3. Settlement ledger (totals, payment attempts; our Payments tab, 03 §10) · 4. Notes & audit timeline with Post note · Right column: customer card, address, invoice download, shipment tracking |
| 47 Admin customers | 1. Title + Export cohort + Broadcast · 2. Segment tabs (All, repeat, high-value, high return risk) · 3. Table (identity, segment, lifetime spend/orders, returns, last order, support) · 4. Pagination · 5. Right detail drawer (notes) linking to the support one-shot view |
| 48 Admin reviews | 1. Title + Export + moderation settings · 2. Tabs (Pending, Approved, Flagged, Media, Hidden) · 3. Verified-only toggle + bulk actions · 4. Review cards (rating, text, media, verified marker, order ref) with Approve / Reject / Feature · 5. Detail panel: publish targets + staff reply + Approve & publish. **Auto-approve rules must never set verified status manually**, because verified is derived. |
| 51 Admin coupons | 1. Title + Export + New coupon · 2. Tabs (Active, Public codes, Private codes, Archived) · 3. Coupon table with usage bars, validity, status, Pause/Edit, bulk deactivate/extend · 4. Configurator panel: code, type/value, eligible SKUs/collections, min spend, customer lock, single-use, stackable-with-offers toggle (06 §3), Save / Generate N unique codes |

## 8. Catalogue screens with no Stitch design yet

02 Home editorial variant · 05 Collection filtered · 06/07 Search results/empty · 09 Size finder ·
29 Mobile payment · 30 Mobile tracking (`/track/[token]`) · 32 Sign up · 35 Order detail ·
36/37 Return request/success · 39 About · 49 Review composer · 50 Testimonials · 52 Analytics ·

Build these from the nearest designed sibling (e.g. 30 reuses the 20 timeline, 35 reuses the 46
layout in the customer shell) and the same tokens.

## 9. Copy and scope deviations to apply when implementing

- The brand becomes **wavy**. Drop "FORM/01", "Atelier/Patron/Dossier" jargon where it hurts clarity. Checkout labels must be plain ("Order summary", "Pay ₹14,797").
- Carrier names are not hard-coded (Stitch says "BlueDart"). The courier comes from Shiprocket.
- Not in v1 scope: ERP sync, multi-warehouse nodes, 3D mesh diagnostics, VIP tiers, repair ledgers, buy-back credits, live GPS telemetry, Apple Pay. They may appear only as content blocks.
