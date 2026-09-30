
SCREEN CATALOGUE & TRACEABILITY
wavy 56-screen inventory and screen-level requirements
wavy Fashion Commerce System | Requirements Pack v1.0 | 25 Sep 2026
Scope: Defines what must be built: product capabilities, user-visible behavior, data, integrations, visual requirements, screen inventory and acceptance conditions. It does not define implementation approach, framework choice or project schedule.
1. Complete screen inventory
#
Screen
Zone
Required contents
01
Home / Desktop
Storefront
Hero; primary nav; best/new arrivals; featured collection; Complete the Look; social proof; journal.
02
Home / Editorial Variant
Storefront
Asymmetrical editorial composition using the same navigation, tokens and product language.
03
Collection / Clothing
Storefront
Title; intro; category/size/color/price/material/availability filters; sort; 4-column grid.
04
Collection / Sneakers
Storefront
Footwear grid; size/color/silhouette/material/price/availability filters; Latest Drop state.
05
Collection / Filtered
Storefront
Active filters: Black, M, Under ₹3,000; result count; clear all; clean grid.
06
Search / Results
Storefront
Large search; query summary; recent/popular searches; filters; sort; result grid; recommendations.
07
Search / Empty
Storefront
No-results message; suggested searches; category shortcuts; New In CTA.
08
Product / Default
Storefront
Gallery; title; price; rating; swatches; size; try-on; purchase CTAs; delivery check; details; reviews; recommendations.
09
Product / Size Finder
Storefront
Height/chest/waist/preferred fit inputs; recommended size; explanation; Use Size.
10
Product / Try-On
Storefront
Visual-assistance entry; source-image guidance; privacy note; generate action.
11
Product / Try-On Result
Storefront
Result image; product context; visualization disclaimer; add to bag/continue.
12
Product / Reviews
Storefront
Rating summary; review list; verified status; sorting/filtering; review CTA.
13
Wishlist
Storefront
Saved items; availability; move to bag; remove.
14
Cart Drawer
Storefront
Items; quantities; subtotal; shipping message; checkout CTA.
15
Cart
Storefront
Full cart; coupon; totals; cross-sells; checkout.
16
Checkout / Contact
Checkout
Guest-first contact fields; validation.
17
Checkout / Address
Checkout
Address fields; saved address option; validation.
18
Checkout / Shipping
Checkout
Eligible methods; delivery estimate; cost.
19
Checkout / Payment
Checkout
Payment methods; provider state; order summary; confirmation.
20
Order Success
Post-purchase
Order number; summary; tracking/account next steps.
21
Mobile / Home
Mobile
Mobile nav; hero; product rail; featured content.
22
Mobile / Collection
Mobile
Compact title; responsive product grid; filter/sort.
23
Mobile / Product
Mobile
Gallery; variants; size; purchase CTA; delivery; trust; reviews.
24
Mobile / Product Variant
Mobile
Variant selection and availability.
25
Mobile / Search
Mobile
Search; suggestions; result state.
26
Mobile / Filters
Mobile
Filter sheet; apply; clear.
27
Mobile / Cart
Mobile
Cart items; totals; coupon; checkout.
28
Mobile / Checkout
Mobile
Single-column contact/address/shipping flow.
29
Mobile / Payment
Mobile
Payment choice; total; secure confirmation.
30
Mobile / Tracking
Mobile
Shipment state; tracking; timeline; help.
31
Login
Account
Email/password login; validation; recovery entry.
32
Sign Up
Account
Registration; consent/terms; validation.
33
Account
Account
Profile; addresses; orders; returns; preferences.
34
Orders
Account
Order list; status; total; date; detail.
35
Order Detail
Account
Items; payment; shipment; totals; eligible actions.
36
Return Request
Account
Eligible item; reason; notes/evidence; submit.
37
Return Success
Account
Request reference; received state; next steps.
38
FAQ
Content
Categorized questions; search/expand.
39
About
Content
Brand story; values; materials/process/service.
40
Lookbook
Content
Editorial grid; stories; linked products.
41
Admin / Dashboard
Admin
Commerce KPIs; orders; sales; low stock; alerts; shortcuts.
42
Admin / Products
Admin
Search/filter; table; publish state; actions.
43
Admin / Product Editor
Admin
Product info; media; variants; pricing; inventory link; SEO; publish.
44
Admin / Inventory
Admin
Variant stock; low stock; adjustments.
45
Admin / Orders
Admin
Order table; search; status filters; actions.
46
Admin / Order Detail
Admin
Customer; items; payment; shipment; notes; timeline; actions.
47
Admin / Customers
Admin
Customer list; search; order summary; detail.
48
Admin / Review Moderation
Admin
Pending/approved/rejected; verification marker; moderation actions.
49
Admin / Review Composer
Admin
Editorial/admin review composition; no fabricated verified status.
50
Admin / Testimonials
Admin
List; author; status; create/edit.
51
Admin / Coupons
Admin
Code; discount; usage; validity; restrictions; status; create/edit.
52
Admin / Analytics
Admin
Date range; revenue; AOV; conversion; charts; funnel; product/category breakdown.
53
Admin / Campaigns
Admin
Campaign states; channels; performance; create/edit.
54
Admin / Shipping
Admin
Provider; pickup; free-shipping threshold; windows; COD; returns courier.
55
Admin / Integrations
Admin
Razorpay; Shiprocket; Resend; GA4; PostHog; AI provider; status/config.
56
Admin / AI Try-On Analytics
Admin
Generations; completion; Try-On ATC; Try-On Purchase; funnel; provider; usage/cost; TTL.
2. Global screen rules
Every screen maps to one or more PRD/SRS requirements.
Related screens reuse the same shell, navigation, components, content terms and visual tokens.
Underlying features expose loading, empty, error and disabled states where applicable.
Mobile screens preserve the same information architecture as desktop.
Admin screens use a light content canvas with operational data density appropriate to the task.
AI try-on screens retain the visualization disclaimer and temporary-asset requirements.
3. Navigation requirements
Zone
Navigation
Desktop storefront
New In, Clothing, Sneakers, Collections, Journal + Search, Wishlist, Account, Bag.
Mobile storefront
Menu + Search + Wishlist + Account + Bag; contextual collection/product navigation.
Customer account
Account, Orders, Addresses/Profile, Returns, Logout.
Admin
Dashboard, Products, Inventory, Orders, Customers, Reviews, Testimonials, Coupons, Analytics, Campaigns, Shipping, Integrations, AI Try-On Analytics.
4. Screen-to-requirement mapping
#
Screen
Primary PRDs
01
Home / Desktop
PRD-001 to PRD-008
02
Home / Editorial Variant
PRD-001 to PRD-008
03
Collection / Clothing
PRD-001 to PRD-008
04
Collection / Sneakers
PRD-001 to PRD-008
05
Collection / Filtered
PRD-001 to PRD-008
06
Search / Results
PRD-001 to PRD-008
07
Search / Empty
PRD-001 to PRD-008
08
Product / Default
PRD-001 to PRD-008
09
Product / Size Finder
PRD-005, PRD-006, PRD-004
10
Product / Try-On
PRD-005, PRD-006, PRD-004
11
Product / Try-On Result
PRD-005, PRD-006, PRD-004
12
Product / Reviews
PRD-011
13
Wishlist
PRD-001 to PRD-008
14
Cart Drawer
PRD-001 to PRD-008
15
Cart
PRD-001 to PRD-008
16
Checkout / Contact
PRD-009
17
Checkout / Address
PRD-009
18
Checkout / Shipping
PRD-009
19
Checkout / Payment
PRD-009
20
Order Success
PRD-001 to PRD-008
21
Mobile / Home
PRD-018 plus journey PRDs
22
Mobile / Collection
PRD-018 plus journey PRDs
23
Mobile / Product
PRD-018 plus journey PRDs
24
Mobile / Product Variant
PRD-018 plus journey PRDs
25
Mobile / Search
PRD-018 plus journey PRDs
26
Mobile / Filters
PRD-018 plus journey PRDs
27
Mobile / Cart
PRD-018 plus journey PRDs
28
Mobile / Checkout
PRD-018 plus journey PRDs
29
Mobile / Payment
PRD-018 plus journey PRDs
30
Mobile / Tracking
PRD-018 plus journey PRDs
31
Login
PRD-010, PRD-011
32
Sign Up
PRD-010, PRD-011
33
Account
PRD-010, PRD-011
34
Orders
PRD-010, PRD-011
35
Order Detail
PRD-010, PRD-011
36
Return Request
PRD-010, PRD-011
37
Return Success
PRD-010, PRD-011
38
FAQ
PRD-014, PRD-019
39
About
PRD-014, PRD-019
40
Lookbook
PRD-014, PRD-019
41
Admin / Dashboard
PRD-012 to PRD-017
42
Admin / Products
PRD-012 to PRD-017
43
Admin / Product Editor
PRD-012 to PRD-017
44
Admin / Inventory
PRD-012 to PRD-017
45
Admin / Orders
PRD-012 to PRD-017
46
Admin / Order Detail
PRD-012 to PRD-017
47
Admin / Customers
PRD-012 to PRD-017
48
Admin / Review Moderation
PRD-011
49
Admin / Review Composer
PRD-011
50
Admin / Testimonials
PRD-012 to PRD-017
51
Admin / Coupons
PRD-014
52
Admin / Analytics
PRD-015, PRD-006
53
Admin / Campaigns
PRD-012 to PRD-017
54
Admin / Shipping
PRD-012 to PRD-017
55
Admin / Integrations
PRD-012 to PRD-017
56
Admin / AI Try-On Analytics
PRD-015, PRD-006
