# 05 · Observability and Support

Goal: when a customer writes "my payment failed", support opens one screen and sees what
happened within 30 seconds. An engineer then needs only one `requestId` to find the logs.

## 1. Logging standard

The logger is `src/lib/logger.ts`: JSON lines in production, coloured compact output in dev, and
keys matching `/pass|secret|token|authorization|api_key|card|cvv|signature/i` redacted.

```ts
const log = logger.child({ svc: "payments", orderId, attemptId });
log.info("payment.intent_created", { provider: "razorpay", amount });
log.error("payment.verify_failed", err, { step: "signature" });
```

| Rule | Detail |
|---|---|
| Event names | `domain.action` in snake_case: `cart.item_added`, `checkout.order_placed`, `payment.webhook_duplicate`, `shipment.status_advanced`, `integration.check_failed`, `request.done`, `request.crashed` |
| Levels | `debug`: dev only. `info`: state changes and `request.done`. `warn`: expected rejections (4xx, dedupe, validation). `error`: someone must act (5xx, signature mismatch, provider down, dead outbox job). |
| Required context | `app`, `svc`, `requestId`, `method`, `path` (added by `route()`); plus the entity ids relevant to the event: `orderId`, `attemptId`, `shipmentId`, `userId`, `visitorId` |
| Request id | Minted in `proxy.ts` (`crypto.randomUUID()`), forwarded as the `x-request-id` request header, and returned on every response. Error bodies include `ref <first 8 chars>`. Outbox jobs carry the originating `requestId` in their payload. |
| Never log | Secrets, full card/UPI VPA, OTPs, raw webhook signatures, full tracking tokens (log `trackingTokenPrefix`), full addresses (log `pincode` only), passwords. Email and phone are logged **only** as `userId`; support looks up PII in the DB, not in logs. |
| Never | `console.log` in app code; logging inside tight loops; logging entire provider payloads at info level (store them redacted in `payment_events.payload` instead) |
| Duration | `request.done` carries `ms`. Provider calls log `integration.call` with `{provider, op, ms, status}`. |

Shipping: **Vercel Log Drain → Axiom** (or Better Stack) with 30-day retention and saved queries.
`requestId`, `svc` and `msg` are indexed fields.

## 2. Customer journey tracking

Three sinks, one visitor identity.

| Sink | What | Why |
|---|---|---|
| **PostHog** (`posthog-js` client + server capture from outbox) | All SRS §3 commerce events plus `$pageview`, autocapture off, session replay on `/checkout/**` with inputs masked | Funnels, retention, replay, feature flags |
| **GA4** (gtag on client + Measurement Protocol for `purchase` from the server) | `page_view`, `view_item`, `add_to_cart`, `begin_checkout`, `purchase` | Marketing attribution and Google Ads |
| **Postgres** `visitor_sessions` + `analytics_events` | First-party copy of commerce-relevant events | The support console and admin analytics must not depend on third-party retention, and must join with orders |

Identity:
- `proxy.ts` sets a first-party cookie `bb_vid` (uuid, 1 year, `SameSite=Lax`) on first visit.
- A session is `bb_sid` with a 30-min idle timeout, and gets a new id if UTM parameters change.
- On login or checkout, `visitor_sessions.user_id` and `email_hash` are linked, and `posthog.identify(userId)` runs. `orders.visitor_id` stores the buyer's visitor id.
- Consent: a banner stores `bb_consent = {analytics, marketing}`. Without analytics consent, PostHog and GA4 do not load, and only the strictly-necessary events below go to Postgres (legitimate interest for order support): `checkout_started`, `payment_*` and `order_created`.

Tables:

```text
visitor_sessions(id, visitor_id, user_id, started_at, last_seen_at, landing_path, referrer,
                 utm_source, utm_medium, utm_campaign, device, browser, os, city, country)
analytics_events(id, session_id, visitor_id, user_id, name, path, props jsonb, at)  -- monthly partitions
```

Ingestion: `POST /api/analytics/events` accepts a batch (≤ 20 events, flushed every 10 s or on
`visibilitychange` via `navigator.sendBeacon`). Event names are validated against the SRS event
list. Unknown names are dropped, and the payload is capped at 2 KB per event.

## 3. Support console: one-shot customer view

Route `/admin/support/customers/[id]`, also reachable from an order, ticket or search. Permission
is `support.view` (support_agent, order_manager, super_admin). It is backed by
`GET /api/admin/support/customers/[id]/overview`, which runs one parallel fan-out and
renders every panel independently: if one panel fails, the others still show.

| Panel | Source | Content |
|---|---|---|
| Identity | `profiles`, `auth.users` | name, email (with bounce status), phone, created, last login, marketing consent, return count (90 d), lifetime value, orders count |
| Live cart | `carts` + `cart_items` (latest by user or visitor) | lines, current server totals, applied coupon, offer nudges, last updated |
| Payment attempts | `v_payment_timeline` | every attempt across orders: provider, method, amount, status, **failure_stage**, provider error text, callback/webhook timeline, customer-facing message shown |
| Orders | `orders`, `order_events` | status chips, totals snapshot, coupon, items, cancel/refund history |
| Shipments | `shipments`, `shipment_events` | carrier, AWB (copy button), live status, ETA, NDR/exception reasons, `/track/[token]` link |
| Returns | `return_requests` | status, reason, evidence thumbnails (signed URLs, 5-min expiry) |
| Tickets | `support_tickets`, `ticket_messages` | open/closed tickets, channel (email/WhatsApp/form), SLA timer, internal notes |
| Emails | `notifications` | every transactional email with its Resend status |

Quick actions: **Resend confirmation email**, **Re-check payment with gateway**, **Create ticket**,
**Copy customer-safe status summary**, **Issue refund** (only with `orders.refund`). Every action writes `audit_logs`.

Opening the view writes `audit_logs(action='support.customer_viewed')`, because it exposes PII (DPDP Act 2023).

Tickets: `support_tickets(id, number, customer_id, order_id, subject, status open/pending/resolved/closed, priority, channel, assignee_id, sla_due_at)` and `ticket_messages(id, ticket_id, author_type customer/staff/system, body, internal bool, attachments, at)`. Inbound email to `support@` goes through a Resend inbound webhook (`POST /api/support/inbound`), which creates or threads a ticket.

## 4. Integration health and alerting

`integration_configs(provider, environment, status connected/needs_attention/disconnected, config jsonb non-secret, last_checked_at, last_ok_at, last_error, consecutive_failures)`

- **Passive:** every adapter call runs through `integrations.track(provider, op, fn)`. Three consecutive failures set the status to `needs_attention`. The first success resets it to `connected`.
- **Active:** the `integration-health` cron (every 10 min) makes one cheap authenticated call per enabled provider:
  - Razorpay `GET /v1/payments?count=1`
  - PayU `verify_payment` against a dummy txn
  - Shiprocket token refresh or `GET /courier/serviceability`
  - Resend `GET /domains`
  - PostHog `/decide`
  - the VTON provider's health endpoint
- A missing env key → `disconnected`.

| Alert | Condition | Severity | Channel |
|---|---|---|---|
| Checkout down | `POST /api/checkout` 5xx > 5% over 5 min | P1 | phone + Slack `#wavy-alerts` |
| Payment failure spike | failure rate > 25% over 15 min (≥ 20 attempts), split by provider | P1 | phone + Slack |
| Signature mismatch | any `payment.signature_mismatch` or `payment.webhook_bad_signature` | P1 | Slack |
| Webhook silence | enabled gateway, attempts > 0, no webhook in 60 min | P2 | Slack |
| Integration down | any provider `needs_attention` > 10 min or `disconnected` | P2 | Slack + admin dashboard banner |
| Outbox dead letters | any `outbox.status='dead'` | P2 | Slack |
| Reconciliation issues | `reconciliation_issues` open > 0 | P2 | Slack + email to finance |
| Low stock | variant below `low_stock_threshold` | P3 | admin dashboard + daily digest |
| Error budget burn | 2% of monthly budget per hour (fast burn) | P2 | Slack |
| Shiprocket create_order lag | paid orders without shipment > 2 h | P2 | Slack |

Implementation: Axiom monitors on log queries (`msg == "payment.signature_mismatch"`), plus a SQL
`alerts_check()` run by `pg_cron` every 5 min for DB-state alerts. `alerts_check()` posts to a
Slack webhook through `pg_net`. There is no extra alerting service until the team grows.

## 5. Dashboards

| Dashboard | Where | Panels |
|---|---|---|
| Ops health | Axiom | RPS and p95 by `svc`; 5xx by route; provider latency and errors; outbox depth; cron last-run |
| Payments | Admin `/admin/analytics/payments` (SQL) + PostHog | success rate by provider and method; failures by `failure_stage` (stacked, daily); retries per order; time-to-confirm p50/p95; refunds |
| Commerce | Admin `/admin/analytics` (from `daily_metrics`) | revenue, orders, AOV, conversion, top products/categories, coupon usage, bundle-offer uptake |
| Funnel | PostHog | `page_view → product_viewed → add_to_cart → checkout_started → payment_initiated → payment_succeeded`, split by device and UTM |
| Fulfilment | Admin `/admin/shipping` | paid→packed hours, packed→delivered days, NDR rate, RTO rate by courier and pincode |
| Support | Admin `/admin/support` | open tickets, SLA breaches, top contact reasons (tagged), payment-issue tickets vs `failure_stage` |
