import { describe, expect, it } from "vitest";
import { toTracking } from "@/backend/orders/mapper";
import { normalizeQuote } from "./quote";

describe("normalizeQuote", () => {
  it("maps compute_pricing json, keeping paise integers", () => {
    const q = normalizeQuote({
      valid: false, currency: "INR", subtotal: 299700, offerDiscount: 99700, couponDiscount: 0, discount: 99700,
      shipping: 0, codFee: 4900, tax: 21429, taxRate: 12, taxInclusive: true, total: 204900, appliedCoupon: null,
      coupon: { id: null, code: "NOPE", type: null, valid: false, error: "coupon_not_found", discount: 0, freeShipping: false },
      errors: [{ variantId: "v9", code: "insufficient_stock", available: 1 }, { code: "cod_limit_exceeded", max: 1000000 }],
      lines: [{
        variantId: "v1", productId: "p1", categoryId: "c1", sku: "BOOK-1", name: "Book", brand: null, slug: "book",
        variantTitle: "Default", options: [], image: null, unitPrice: 99900, compareAtPrice: null, quantity: 3, maxQuantity: 10,
        lineSubtotal: 299700, discount: 99700, lineTotal: 200000, hsnCode: "4901", returnWindowDays: 7,
      }],
      appliedDiscounts: [{ kind: "offer", id: "o1", name: "Any 3", type: "bundle_fixed_price", amount: 99700, applications: 1 }],
      offerNudges: [{ offerId: "o1", itemsNeeded: 2, message: "Add 2 more" }],
      shippingMethod: { id: "s1", code: "std", name: "Standard", rate: 4900, minDays: 2, maxDays: 5 },
    });
    expect(q.valid).toBe(false);
    expect(q.total).toBe(204900);
    expect(q.lines[0]).toMatchObject({ quantity: 3, lineTotal: 200000, brand: undefined, image: undefined, compareAtPrice: undefined });
    expect(q.errors).toEqual([
      { code: "insufficient_stock", variantId: "v9", available: 1, provider: undefined, max: undefined },
      { code: "cod_limit_exceeded", variantId: undefined, available: undefined, provider: undefined, max: 1000000 },
    ]);
    expect(q.coupon).toMatchObject({ valid: false, error: "coupon_not_found", code: "NOPE" });
    expect(q.appliedCoupon).toBeUndefined();
    expect(q.appliedDiscounts[0]).toMatchObject({ kind: "offer", amount: 99700 });
    expect(q.offerNudges).toEqual([{ offerId: "o1", message: "Add 2 more", itemsNeeded: 2 }]);
    expect(q.shippingMethod?.rate).toBe(4900);
  });
  it("tolerates an empty/garbage payload", () => {
    const q = normalizeQuote(null);
    expect([q.valid, q.total, q.lines.length, q.coupon, q.shippingMethod]).toEqual([false, 0, 0, null, null]);
  });
});

describe("toTracking", () => {
  it("maps get_order_tracking json and returns null for unknown tokens", () => {
    expect(toTracking(null)).toBeNull();
    const t = toTracking({
      number: "wavy-1001", status: "shipped", paymentStatus: "captured", placedAt: "2026-09-01T10:00:00Z",
      shipTo: { name: "Asha", city: "Pune", state: "Maharashtra", postalCode: "411001" },
      items: [{ name: "Book", variantTitle: "Default", options: [{ name: "Format", value: "Paperback" }], quantity: 1, image: null }],
      shipment: { carrier: "Delhivery", awb: "123", status: "in_transit", eta: null, trackingUrl: null,
        events: [{ at: "2026-09-02T00:00:00Z", status: "picked_up" }, { at: "2026-09-03T00:00:00Z", status: "in_transit", location: "Hub" }] },
      history: [{ status: "paid", at: "2026-09-01T10:01:00Z" }],
    });
    expect(t?.items[0]).toEqual({ name: "Book", variantTitle: "Default", options: [{ name: "Format", value: "Paperback" }], quantity: 1, image: undefined });
    expect(t?.shipment?.events.map((e) => e.status)).toEqual(["in_transit", "picked_up"]);
  });
});
