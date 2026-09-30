import { describe, expect, it } from "vitest";
import { attemptFor } from "./draft";

let n = 0;
const next = () => `k${++n}`;
const body = { email: "a@b.co", items: [{ variantId: "v1", quantity: 1 }], paymentProvider: "razorpay" };

describe("attemptFor (Idempotency-Key per checkout attempt)", () => {
  it("reuses the key when the same payload is re-submitted", () => {
    const first = attemptFor(body, undefined, next);
    expect(attemptFor({ ...body }, first, next)).toBe(first);
    expect(first.key).toMatch(/^co_.{2,}$/); // server requires 8..200 chars with a uuid in practice
  });

  it("issues a fresh key when anything in the payload changes", () => {
    const first = attemptFor(body, undefined, next);
    const changed = attemptFor({ ...body, items: [{ variantId: "v1", quantity: 2 }] }, first, next);
    expect(changed.key).not.toBe(first.key);
    expect(attemptFor({ ...body, paymentProvider: "cod" }, changed, next).key).not.toBe(changed.key);
  });

  it("defaults to a uuid-based key long enough for the API", () => {
    expect(attemptFor(body, undefined).key.length).toBeGreaterThanOrEqual(8);
  });
});
