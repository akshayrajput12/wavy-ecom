import { describe, expect, it } from "vitest";
import { CouponPatchSchema, CouponSchema, DiscountTargetsSchema, OfferSchema } from "./marketing";

const P1 = "30000000-0000-4000-8000-000000000001";
const C1 = "10000000-0000-4000-8000-000000000003";

describe("DiscountTargetsSchema", () => {
  it("defaults mode to include", () => {
    expect(DiscountTargetsSchema.parse([{ kind: "product", id: P1 }])).toEqual([{ mode: "include", kind: "product", id: P1 }]);
  });
  it("accepts includes and excludes of different targets", () => {
    expect(DiscountTargetsSchema.safeParse([
      { mode: "include", kind: "category", id: C1 }, { mode: "exclude", kind: "product", id: P1 },
    ]).success).toBe(true);
  });
  it("rejects the same target twice, even with different modes", () => {
    const r = DiscountTargetsSchema.safeParse([{ mode: "include", kind: "product", id: P1 }, { mode: "exclude", kind: "product", id: P1 }]);
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual([1]);
  });
  it("rejects unknown kinds and non-uuid ids", () => {
    expect(DiscountTargetsSchema.safeParse([{ kind: "brand", id: P1 }]).success).toBe(false);
    expect(DiscountTargetsSchema.safeParse([{ kind: "product", id: "abc" }]).success).toBe(false);
  });
});

describe("CouponSchema", () => {
  it("uppercases codes and keeps targets", () => {
    const c = CouponSchema.parse({ code: "welcome10", type: "percent", value: 10, targets: [{ kind: "collection", id: P1 }] });
    expect(c.code).toBe("WELCOME10");
    expect(c.targets).toHaveLength(1);
  });
  it("mirrors the DB value check per type", () => {
    expect(CouponSchema.safeParse({ code: "BIG", type: "percent", value: 120 }).success).toBe(false);
    expect(CouponSchema.safeParse({ code: "FLAT", type: "fixed", value: 0 }).success).toBe(false);
    expect(CouponSchema.safeParse({ code: "SHIP", type: "free_shipping", value: 100 }).success).toBe(false);
    expect(CouponSchema.safeParse({ code: "SHIP", type: "free_shipping" }).success).toBe(true);
  });
  it("rejects an end before the start", () => {
    const r = CouponSchema.safeParse({ code: "WIN", type: "fixed", value: 500, startsAt: "2026-10-02T00:00:00Z", endsAt: "2026-10-01T00:00:00Z" });
    expect(r.error?.issues[0].path).toEqual(["endsAt"]);
  });
  it("PATCH only checks value when type or value is sent", () => {
    expect(CouponPatchSchema.safeParse({ status: "paused" }).success).toBe(true);
    expect(CouponPatchSchema.safeParse({ type: "percent", value: 0 }).success).toBe(false);
  });
});

describe("OfferSchema", () => {
  it("requires the fields of its type", () => {
    const r = OfferSchema.safeParse({ name: "3 for 999", slug: "three-for-999", type: "bundle_fixed_price", requiredQty: 3 });
    expect(r.error?.issues.map((i) => i.path[0])).toEqual(["bundlePrice"]);
    expect(OfferSchema.safeParse({ name: "Tiers", slug: "tiers", type: "tiered_percent", tiers: [{ minQty: 2, percent: 10 }] }).success).toBe(true);
  });
});
