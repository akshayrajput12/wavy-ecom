import { describe, expect, it } from "vitest";
import { paymentMethods, shippingMethods } from "@/data/checkout";
import { estimateTotals } from "./totals";

const [standard, express] = shippingMethods;
const cod = paymentMethods.find((m) => m.id === "cod")!;

describe("estimateTotals", () => {
  it("charges standard shipping below the free threshold", () => {
    const t = estimateTotals([{ unitPrice: 129900, quantity: 1 }], { shipping: standard });
    expect(t.shipping).toBe(standard.cost);
    expect(t.total).toBe(129900 + standard.cost);
  });

  it("frees standard (not express) shipping above threshold", () => {
    const lines = [{ unitPrice: 250000, quantity: 1 }];
    expect(estimateTotals(lines, { shipping: standard }).shipping).toBe(0);
    expect(estimateTotals(lines, { shipping: express }).shipping).toBe(express.cost);
  });

  it("stacks bundle then coupon, adds COD fee, GST is included not added", () => {
    const t = estimateTotals([{ unitPrice: 100000, quantity: 3 }], { shipping: standard, payment: cod, coupon: "welcome10" });
    expect(t.bundleDiscount).toBe(45000);
    expect(t.couponDiscount).toBe(25500);
    expect(t.shipping).toBe(0);
    expect(t.total).toBe(300000 - 70500 + cod.fee);
    expect(t.tax).toBe(Math.round(t.total - t.total / 1.12));
  });

  it("ignores unknown coupons", () => {
    expect(estimateTotals([{ unitPrice: 1000, quantity: 1 }], { coupon: "NOPE" }).couponValid).toBe(false);
  });
});
