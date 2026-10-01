# wavy: System Design

Architecture docs for wavy, a single-store Indian fashion e-commerce site selling clothing and
sneakers, built on Next.js 16, Supabase and Vercel. Read `docs/CONVENTIONS.md` first. Requirements live in `docs/specs/`.

| Doc | Summary |
|---|---|
| [01_ARCHITECTURE.md](01_ARCHITECTURE.md) | Edge → proxy.ts → RSC and route handlers → isolated `src/backend/<svc>` modules → Supabase and providers; request lifecycle, per-page rendering and cache tags, pg_cron jobs, environments. |
| [02_CAPACITY_AND_SCALING.md](02_CAPACITY_AND_SCALING.md) | Traffic model from 50k to 1M monthly visitors, sale-peak RPS and orders/min, DB tiers and connections, what breaks first, rate limits, SLOs, k6 plan, cost tiers in ₹/$. |
| [03_PAYMENTS.md](03_PAYMENTS.md) | Gateway-agnostic adapter (Razorpay / PayU / COD), admin toggles and default, checkout sequence, idempotency and webhook dedupe, the nine failure stages, safe retry, reconciliation, refunds, support lookup. |
| [04_ORDER_LIFECYCLE_AND_TRACKING.md](04_ORDER_LIFECYCLE_AND_TRACKING.md) | Order, shipment and return state machines (SRS states), Shiprocket API and webhook ingestion, `/track/[token]`, the Resend email for each transition. |
| [05_OBSERVABILITY_AND_SUPPORT.md](05_OBSERVABILITY_AND_SUPPORT.md) | Logging standard and request ids, visitor journey tracking (Postgres, PostHog, GA4), the support one-shot customer view, integration health, alerts, dashboards. |
| [06_PRICING_TAX_OFFERS.md](06_PRICING_TAX_OFFERS.md) | Pure `pricing.quote()`: line prices → bundle offers with nudges → one coupon → shipping → GST (inclusive/exclusive, slabs) → paise rounding, with three worked examples. |
| [07_SECURITY_RBAC.md](07_SECURITY_RBAC.md) | Auth flows (customer, staff invite with TOTP), 7-role permission matrix, four enforcement layers, secrets, webhook verification, OWASP checklist, PCI SAQ-A, DPDP. |
| [08_ADMIN_MODULES.md](08_ADMIN_MODULES.md) | Admin information architecture: routes, permissions, content and backing tables per module, the SEO manager (overrides, JSON-LD, sitemap, robots, redirects), shared admin patterns. |
| [PERFORMANCE.md](PERFORMANCE.md) | Public read-path audit: listing sort indexes (0023), rate limiting in `route()`, Cache-Control policy, image config, payload trims, before/after numbers, and the scaling path. |
| [../design/DESIGN_SYSTEM.md](../design/DESIGN_SYSTEM.md) | The token system as implemented (colour, fluid type, Instrument Serif + Sans), spacing, motion, component states, accessibility, how to change typography globally. |
| [../design/SCREENS.md](../design/SCREENS.md) | Maps each Stitch screen to its route and view folder, with section order and deviations to apply. |

## Diagrams

| Image | Shows |
|---|---|
| [images/architecture.svg](images/architecture.svg) | Components and data flow |
| [images/payment-flow.svg](images/payment-flow.svg) | Happy-path checkout → payment → confirmation sequence |
| [images/payment-failure-states.svg](images/payment-failure-states.svg) | Attempt state machine and the nine failure stages |
| [images/order-state-machine.svg](images/order-state-machine.svg) | Order, shipment and return lifecycles, with the email sent at each step |

## Core invariants

1. Money is integer paise. Totals come from `pricing.quote()` on the server only.
2. `confirm_payment()` is the only way an order becomes `paid`. It is idempotent.
3. Every state transition is one SQL function, writes to `order_events` and the `outbox`, and rejects invalid transitions.
4. Provider failures degrade one module, not the site: `route()` isolation, outbox retries, integration status.
5. No card data ever touches our servers (PCI SAQ-A).
