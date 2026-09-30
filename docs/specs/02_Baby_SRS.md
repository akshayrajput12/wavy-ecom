
SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
wavy Functional, system, data, security and integration requirements
wavy Fashion Commerce System | Requirements Pack v1.0 | 25 Sep 2026
Scope: Defines what must be built: product capabilities, user-visible behavior, data, integrations, visual requirements, screen inventory and acceptance conditions. It does not define implementation approach, framework choice or project schedule.
1. Functional requirements
ID
Domain
Requirement
FR-001
Auth
Registration, login, logout and session handling.
FR-002
Guest checkout
Checkout without account creation.
FR-003
Catalog
Categories, collections, products, variants and publish state.
FR-004
Variants
Color/size selection with unavailable-state handling.
FR-005
Filters
Category, size, color, price, material, availability; footwear silhouette where applicable.
FR-006
Search
Search results and useful empty-result recovery.
FR-007
Wishlist
Get/add/remove for authenticated customers.
FR-008
Cart
Add/update/remove, persistence and stock state.
FR-009
Pricing
Server-authoritative totals, discount, shipping and tax where configured.
FR-010
Coupon
Eligibility, restrictions, usage limits and validity.
FR-011
Checkout
Contact, address, shipping, payment and confirmation.
FR-012
Payment
Initiate and verify configured gateway payment; retry safely.
FR-013
Orders
Create and expose order/payment/fulfillment states.
FR-014
Tracking
Shipment/tracking details when available.
FR-015
Returns
Eligibility and return request submission.
FR-016
Reviews
Create/list/moderate and verified-purchase state.
FR-017
Content
FAQ, About, Lookbook, testimonials and campaigns.
FR-018
Admin catalog
CRUD products/variants/collections and publish state.
FR-019
Inventory
Stock, low-stock and adjustment flows.
FR-020
Admin operations
Orders, customers, returns and shipping context.
FR-021
Marketing
Coupons, campaigns, testimonials.
FR-022
Analytics
Commerce + AI try-on reporting.
FR-023
Integrations
Provider connection state/configuration metadata.
FR-024
Try-on
Create session, validate input, process, result, failure, expiry/deletion.
FR-025
Notifications
Transactional messages for account, order, payment, shipping and returns.
FR-026
Audit
High-impact admin actions with actor/entity/time/action.
2. Required states
Entity
States
Product
Draft / Published / Unpublished / Archived
Variant
Active / Out of Stock / Disabled
Order
Pending Payment / Paid / Processing / Packed / Shipped / Delivered / Cancelled / Return Requested / Returned / Refunded
Payment
Initiated / Authorized / Captured / Failed / Refunded / Partially Refunded
Shipment
Created / Picked Up / In Transit / Out for Delivery / Delivered / Exception / Cancelled
Return
Requested / Approved / Rejected / Pickup Scheduled / Received / Refunded / Closed
Review
Pending / Approved / Rejected / Hidden
Coupon
Draft / Active / Paused / Expired / Archived
Campaign
Draft / Scheduled / Live / Paused / Completed / Archived
Integration
Connected / Needs Attention / Disconnected
Try-On
Created / Uploading / Queued / Processing / Completed / Failed / Expired / Deleted
3. Required data entities
Entity
Required fields
User
id, email/auth reference, name, phone, status, role, timestamps
Address
user, name, phone, address lines, city, state, postal code, country, default
Category
name, slug, parent, description, media, order, status, SEO
Collection
name, slug, description, media, membership, status, SEO
Product
name, slug, description, descriptor, category, collections, material, fit, care, media, badges, status, SEO
ProductVariant
product, SKU, color, size, price, compare-at, stock, status, barcode, media
Cart / CartItem
cart/session, variant, quantity, price snapshot, totals
WishlistItem
user, product/variant, created_at
Order / OrderItem
order number, user/contact/address snapshot, line-item snapshots, totals, payment/order state
Payment
order, provider, provider reference, amount, status, timestamps
Shipment
order, provider, tracking number, status, delivery estimate, events
ReturnRequest
order item, reason, notes, evidence, status
Review
product, user, rating, title, body, media, moderation, verified_purchase
Coupon
code, type, value, validity, limits, restrictions, status
Campaign / Testimonial / ContentPage
content metadata, state, media, linked products/collections, SEO
AnalyticsEvent
event name, context payload, timestamp, user/session
TryOnSession
product, user/session, source asset, provider, status, result asset, TTL, usage metadata
IntegrationConfig
provider, environment, non-secret config, status, last checked
AuditLog
actor, action, entity, metadata, timestamp
4. Roles and permissions
Role
Permissions
Super Admin
All modules and configuration.
Catalog Manager
Catalog, variants, collections and inventory.
Order Manager
Orders, shipments, customer order context and returns.
Marketing / Content Manager
Coupons, campaigns, testimonials, FAQ, About and Lookbook.
Analyst
Analytics and AI analytics read-only.
Customer
Own profile, addresses, wishlist, orders, reviews and returns.
5. Integration requirements
Provider
Required responsibility
Razorpay
Online payment initiation/verification/refunds where supported.
Shiprocket
Shipment/tracking/return-courier context where configured.
Resend
Transactional email delivery.
GA4
Commerce/page analytics.
PostHog
Product events, funnels and feature usage.
AI provider
Try-on generation, result delivery, usage/cost context.
6. Non-functional requirements
ID
Category
Requirement
NFR-001
Performance
Customer pages and grids must avoid unnecessary blocking; images use lazy/non-blocking loading where appropriate.
NFR-002
Responsive
Desktop/tablet/mobile support; 390×844 mobile baseline.
NFR-003
Accessibility
Keyboard access, visible focus, accessible forms, AA contrast, status not conveyed by color alone.
NFR-004
Security
No client exposure of provider secrets; all privileged actions authenticated/authorized.
NFR-005
Privacy
Private customer and try-on assets accessible only to authorized parties; explicit lifecycle/retention.
NFR-006
Reliability
Idempotent payment/order side effects and safe repeated callbacks.
NFR-007
Auditability
High-impact admin changes attributable to actor/time.
NFR-008
Observability
Actionable logs and integration failure states.
NFR-009
Localization
Configurable locale/currency; v1 defaults India/INR.
NFR-010
Content safety
Validation/moderation for uploaded/user-generated content.
7. Error/empty-state requirements
Every async action has loading, success and failure states.
Every list has loading, empty and filtered-empty states.
Payment failure retains cart context and supports safe retry.
Form validation preserves valid input and shows field-level errors.
Try-on failure distinguishes input validation from provider/generation failure.
