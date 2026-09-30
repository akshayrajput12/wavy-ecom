import { describe, expect, it } from "vitest";
import type { OrderItem } from "@/types/domain";
import { returnableItems } from "./eligibility";

const item = (id: string, returnWindowDays: number): OrderItem => ({
  id, productId: null, variantId: null, sku: id, name: id, image: { url: "", alt: "" }, variantTitle: "Default", options: [],
  unitPrice: 1000, quantity: 1, lineTotal: 1000, returnWindowDays,
});
const order = { status: "delivered" as const, deliveredAt: "2026-09-20T10:00:00Z", items: [item("tee", 7), item("socks", 0), item("tv", 30)] };
const NOW = new Date("2026-09-25T12:00:00Z").getTime();

describe("returnableItems", () => {
  it("offers delivered items inside their own window and skips non-returnable ones", () => {
    expect(returnableItems(order, NOW).map((i) => i.id)).toEqual(["tee", "tv"]);
  });

  it("closes each item's window independently", () => {
    expect(returnableItems(order, new Date("2026-10-01T12:00:00Z").getTime()).map((i) => i.id)).toEqual(["tv"]);
  });

  it("offers nothing before delivery or once a return is already requested", () => {
    expect(returnableItems({ ...order, status: "shipped" }, NOW)).toHaveLength(0);
    expect(returnableItems({ ...order, status: "return_requested" }, NOW)).toHaveLength(0);
    expect(returnableItems({ ...order, deliveredAt: undefined }, NOW)).toHaveLength(0);
  });
});
