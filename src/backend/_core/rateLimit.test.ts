import { describe, expect, it } from "vitest";
import { hit, RATE_LIMITS } from "./rateLimit";

describe("hit (fixed window)", () => {
  it("allows max hits per window, then 429s with retry-after, then resets", () => {
    const t = 1_000_000;
    expect(hit("k1", 2, 60, t).ok).toBe(true);
    expect(hit("k1", 2, 60, t + 1).ok).toBe(true);
    expect(hit("k1", 2, 60, t + 2)).toEqual({ ok: false, retryAfter: 60 });
    expect(hit("k1", 2, 60, t + 30_000).retryAfter).toBe(30);
    expect(hit("k1", 2, 60, t + 60_000).ok).toBe(true);
  });

  it("keys are independent (per IP + route)", () => {
    expect(hit("POST checkout 1.1.1.1", 1, 60, 0).ok).toBe(true);
    expect(hit("POST checkout 2.2.2.2", 1, 60, 0).ok).toBe(true);
    expect(hit("POST checkout 1.1.1.1", 1, 60, 1).ok).toBe(false);
  });

  it("covers the abuse-prone public writes", () => {
    for (const k of ["POST checkout", "POST pricing.coupon", "POST reviews", "GET catalog.suggest", "GET orders.track"]) {
      expect(RATE_LIMITS[k]).toBeDefined();
    }
  });
});
