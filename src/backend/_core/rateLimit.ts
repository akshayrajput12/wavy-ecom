/**
 * Fixed-window limiter for public write / expensive endpoints, applied by `route()` (http.ts).
 * Pure (no server-only) so vitest can cover it.
 *
 * ponytail: in-memory, so limits are per server instance (N instances = N x the limit) and reset on
 * deploy. Upgrade path when that matters: a shared store with the same key/window, e.g. Upstash Redis
 * INCR+EXPIRE, or the UNLOGGED Postgres `rate_limits` table + `rate_hit()` from 02_CAPACITY_AND_SCALING §5.
 */

/** [max requests, window seconds], keyed by "<METHOD> <svc>" as passed to route(). */
export const RATE_LIMITS: Record<string, readonly [number, number]> = {
  "GET catalog": [120, 60],                    // /api/products (filters + search hit the DB on a cache miss)
  "GET catalog.suggest": [120, 60],            // typeahead
  "GET shipping.serviceability": [30, 60],     // calls Shiprocket
  "GET orders.track": [30, 60],                // token guessing
  "POST pricing": [60, 60],                    // cart quote (recomputes on every cart change)
  "POST pricing.coupon": [10, 600],            // coupon brute force
  "POST checkout": [10, 600],
  "POST payments.verify": [20, 60],
  "POST payments.retry": [10, 600],
  "POST payments.failure": [20, 60],
  "POST reviews": [5, 600],
  "POST reviews.vote": [30, 60],
  "POST returns": [10, 600],
  "POST orders.cancel": [10, 600],
};

const MAX_KEYS = 10_000;
const windows = new Map<string, { count: number; resetAt: number }>();

/** Counts one hit for `key`. `retryAfter` is in seconds (0 when allowed). */
export function hit(key: string, max: number, windowSec: number, now = Date.now()): { ok: boolean; retryAfter: number } {
  let w = windows.get(key);
  if (!w || w.resetAt <= now) {
    if (windows.size >= MAX_KEYS) for (const [k, v] of windows) if (v.resetAt <= now) windows.delete(k);
    w = { count: 0, resetAt: now + windowSec * 1000 };
    windows.set(key, w);
  }
  w.count += 1;
  return w.count <= max ? { ok: true, retryAfter: 0 } : { ok: false, retryAfter: Math.ceil((w.resetAt - now) / 1000) };
}
