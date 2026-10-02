import { describe, expect, it } from "vitest";
import { categoryOffer } from "./offer";

describe("categoryOffer", () => {
  it("is empty without products", () => expect(categoryOffer([])).toBeUndefined());

  it("takes the deepest discount across rows, rounded down to a multiple of 5", () => {
    expect(categoryOffer([{ priceMin: 99900, maxDiscountPct: 22 }, { priceMin: 49900, maxDiscountPct: 49 }]))
      .toEqual({ kind: "discount", pct: 45 });
    expect(categoryOffer([{ priceMin: 99900, maxDiscountPct: 70 }])).toEqual({ kind: "discount", pct: 70 });
  });

  it("falls back to the cheapest price when nothing is discounted (or under 5%)", () => {
    expect(categoryOffer([{ priceMin: 129900, maxDiscountPct: 0 }, { priceMin: 79900, maxDiscountPct: 4 }]))
      .toEqual({ kind: "from", price: 79900 });
  });
});
