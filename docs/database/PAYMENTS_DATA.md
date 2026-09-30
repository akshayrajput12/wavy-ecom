# wavy: payment data and tracing a failed payment

## Data model

```
orders (1) ── payments (one series per provider, e.g. razorpay, then cod after a switch)
                 └── payment_attempts (one row per try: attempt_no 1, 2, 3…)
orders (1) ── payment_events (every webhook / callback, raw payload, dedupe key)
payments (1) ── refunds
```

| Where to look | Answers |
|---|---|
| `orders.status`, `orders.payment_status` | Current state the customer sees |
| `payments` | Per-provider summary: `attempt_count`, `last_failure_stage/code/reason`, `amount_captured/refunded` |
| `payment_attempts` | **Exactly where each try failed**: `failure_stage` (order_creation, checkout_open, user_cancelled, bank_declined, otp_timeout, insufficient_funds, signature_mismatch, amount_mismatch, webhook_timeout, capture_failed, gateway_error, risk_blocked, network_error, unknown), `failure_source` (customer/bank/gateway/business/internal), provider `failure_code` and `failure_reason`, masked `method_details` (VPA, bank, card last 4), `raw_request`/`raw_response`, and the timestamps `started_at` → `checkout_opened_at` → `completed_at` |
| `payment_events` | What the gateway told us and when, whether the signature was valid, and whether we processed it (`processing_status`, `processing_error`) |
| `order_status_history` | Every order status change with actor and note (for example `payment_timeout`) |
| `analytics_events` | The customer's side: `payment_initiated`, `payment_failed` with `failure_class`, page views before and after |
| `notification_log` | Which emails were sent (payment failed, order confirmed) |

## Guarantees

| Risk | Guard |
|---|---|
| Double order from a double-clicked "Place order" | `place_order(idempotency_key, …)`: advisory lock plus `orders.idempotency_key UNIQUE`. The same key returns the same order with `replayed: true` |
| Customer pays twice (two tabs, retry after a slow success) | `start_payment_attempt` refuses once the order is paid (`order_already_paid`). Partial unique indexes allow **one** authorized/captured payment and attempt per order. A second capture that does reach us is stored as attempt `status = 'duplicate'` with `refundRequired: true` |
| Webhook delivered 3 times | `payment_events UNIQUE (provider, provider_event_id)`: insert `on conflict do nothing`, then process only if inserted. `mark_payment_captured` is idempotent (`already_captured`) |
| Tampered callback amount | `mark_payment_captured` compares the amount with `orders.total`. A mismatch is recorded as `failure_stage = 'amount_mismatch'`, `refundRequired` |
| Stock sold while the customer pays | Online orders reserve stock with a TTL (`store_settings.reservation_ttl_minutes`, extended 15 minutes on each new attempt). On capture it is committed. `release_expired_reservations()` cancels unpaid orders after expiry |
| Payment captured after the order expired | Returns `captured_on_cancelled_order`, `refundRequired`. `reconcile_order_payment` lists it |
| Over-refund | `refunds_before_insert` trigger: the sum of non-failed refunds cannot exceed `amount_captured` (or the duplicate attempt's amount) |

## Backend flow (Razorpay)

1. `place_order(key, payload)` returns `{orderId, total, …}` with status `pending_payment`.
2. The backend creates the Razorpay order. On failure it calls `record_payment_failure(attemptId, 'order_creation', code, msg)`.
3. It calls `start_payment_attempt(orderId, 'razorpay', 'order_xxx', method)`, which returns `{attemptId}`. Pass `attemptId` in Razorpay `notes`.
4. When the widget opens it sets `checkout_opened_at = now(), status = 'checkout_opened'` (service-role update). If the widget fails to open, it records `record_payment_failure(…, 'checkout_open')`.
5. Client handler success → verify the signature → `mark_payment_captured(orderId, attemptId, pay_xxx, amount, 'upi')`. A bad signature is recorded as `record_payment_failure(…, 'signature_mismatch')`. `modal.ondismiss` is recorded as `'user_cancelled'`.
6. Webhook `payment.captured` / `payment.failed`: insert `payment_events`. If it is new, look up the attempt by `notes.attemptId` or `provider_order_id` and call the same RPCs. Set `processing_status`.
7. A cron job every 5 minutes calls `release_expired_reservations()`. For attempts older than 15 minutes that are still `created`, `checkout_opened` or `pending`, it polls Razorpay, then captures or marks `webhook_timeout`.

## Support runbook: "my payment failed" / "money deducted but no order"

Replace `:q` with the order number, email or phone the customer gives you.

**1. Find the order and its current state**

```sql
select o.id, o.order_number, o.status, o.payment_status, o.total / 100.0 as total_inr,
       o.payment_provider, o.placed_at, o.email, o.phone
from orders o
where o.order_number = :q or lower(o.email) = lower(:q) or o.phone = :q
order by o.placed_at desc
limit 10;
```

**2. See every attempt: where and why it failed**

```sql
select a.attempt_no, a.provider, a.status, a.method, a.amount / 100.0 as inr,
       a.failure_stage, a.failure_source, a.failure_code, a.failure_reason,
       a.method_details, a.provider_order_id, a.provider_payment_id,
       a.started_at, a.checkout_opened_at, a.completed_at,
       a.completed_at - a.started_at as took
from payment_attempts a
where a.order_id = :order_id
order by a.started_at;
```

How to read the result:

| What you see | Meaning | Action |
|---|---|---|
| `checkout_opened_at` is null and stage is `checkout_open` | The widget never opened (ad-blocker, network) | Ask the customer to retry in another browser |
| `user_cancelled` | The customer closed the popup | Safe to retry |
| `bank_declined` / `insufficient_funds` / `risk_blocked` | The bank or gateway refused | Suggest another method |
| `otp_timeout` | 3DS or UPI collect expired | Retry |
| `signature_mismatch` | Callback failed verification | Escalate to engineering. Check the webhook event for the true status |
| status `created`/`pending` with no terminal event and old `started_at` | Webhook missing | Run step 4 |
| status `duplicate` | Customer paid twice | Refund that attempt (step 5) |
| `amount_mismatch` | Captured amount ≠ order total | Refund and escalate |

**3. What the gateway sent us**

```sql
select e.received_at, e.source, e.event_type, e.signature_valid, e.processing_status, e.processing_error,
       e.provider_payment_id, e.payload -> 'payload' -> 'payment' -> 'entity' ->> 'error_description' as gateway_error
from payment_events e
where e.order_id = :order_id
   or e.provider_order_id in (select provider_order_id from payment_attempts where order_id = :order_id)
order by e.received_at;
```

**4. Reconcile ("money deducted but order still pending")**

```sql
select reconcile_order_payment(:order_id);
-- {"orderStatus": "...", "successfulAttemptId": ..., "refundsNeeded": [...], "capturedWhileCancelled": false, "repair": {...}}
```

If an attempt is captured but the order is still `pending_payment`, this call **repairs** the order to `paid`, commits stock and applies the coupon. If Razorpay shows a capture that we never recorded, the backend "Sync with gateway" action fetches it and calls `mark_payment_captured`.

**5. Refund a duplicate or mismatched capture**

```sql
insert into refunds (payment_id, order_id, attempt_id, amount, reason, idempotency_key)
select a.payment_id, a.order_id, a.id, a.amount, 'duplicate capture', 'dup-' || a.id
from payment_attempts a where a.id = :attempt_id and a.status in ('duplicate', 'failed');
-- the backend then calls the Razorpay refund API and sets status = 'processed', provider_refund_id = 'rfnd_…'
```

**6. The customer's full journey (pages, cart, payment tries, tickets)**

```sql
select * from get_customer_journey(:user_id, 200);   -- requires journey.read
```

For guests without a user id, go by the order's visitor session:

```sql
select e.created_at, e.event_name, e.path, e.properties
from analytics_events e
where e.visitor_session_id = (select visitor_session_id from orders where id = :order_id)
  and e.created_at > now() - interval '7 days'
order by e.created_at;
```

**7. Failure dashboard (last 7 days)**

```sql
select a.provider, a.failure_stage, a.failure_code, count(*) as attempts,
       count(distinct a.order_id) as orders,
       count(distinct a.order_id) filter (where o.payment_status = 'captured') as recovered_later
from payment_attempts a join orders o on o.id = a.order_id
where a.started_at > now() - interval '7 days' and a.status in ('failed', 'cancelled')
group by 1, 2, 3 order by attempts desc;
```
