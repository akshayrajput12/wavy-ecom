import { describe, expect, it } from "vitest";
import type { CartLine } from "../../../types/domain";
import { estimateCart } from "./cartMath";

const rules = { bundleIds: ["tee", "tank"], bundleSize: 3, bundlePrice: 99900, freeThreshold: 299900, shippingFee: 9900 };
const line = (productId: string, unitPrice: number, quantity: number): CartLine => ({
  id: productId, variantId: productId, productId, name: productId, image: { url: "", alt: "" },
  color: "Black", size: "M", unitPrice, quantity, maxQuantity: 10,
});

describe("estimateCart", () => {
  it("is empty and free for an empty bag", () => {
    expect(estimateCart([], rules)).toMatchObject({ count: 0, total: 0, shipping: 0, itemsForBundle: 0 });
  });

  it("nudges toward the bundle and charges shipping below threshold", () => {
    const e = estimateCart([line("tee", 49900, 2)], rules);
    expect(e).toMatchObject({ subtotal: 99800, bundleDiscount: 0, itemsForBundle: 1, shipping: 9900, total: 109700 });
  });

  it("applies 3 for ₹999 using the priciest eligible units first", () => {
    const e = estimateCart([line("tee", 54900, 2), line("tank", 44900, 2)], rules);
    // group = 549 + 549 + 449 → 999; remaining 1 tank needs 2 more
    expect(e.bundleDiscount).toBe(54900 * 2 + 44900 - 99900);
    expect(e.itemsForBundle).toBe(2);
  });

  it("ignores ineligible lines for the bundle and grants free shipping over threshold", () => {
    const e = estimateCart([line("hoodie", 499900, 1), line("tee", 49900, 3)], rules);
    expect(e.bundleDiscount).toBe(49900 * 3 - 99900);
    expect(e.shipping).toBe(0);
    expect(e.total).toBe(499900 + 99900);
  });
});
