import { describe, expect, it } from "vitest";
import { orders, returns } from "@/data/orders";
import { returnableItems } from "./eligibility";

const byNo = (n: string) => orders.find((o) => o.number === n)!;
const NOW = new Date("2026-09-25T12:00:00+05:30").getTime();

describe("returnableItems", () => {
  it("allows delivered orders inside the window", () => {
    expect(returnableItems(byNo("BB10421"), returns, NOW)).toHaveLength(3);
  });
  it("blocks orders outside the window or not delivered", () => {
    expect(returnableItems(byNo("BB10312"), returns, NOW)).toHaveLength(0);
    expect(returnableItems(byNo("BB10458"), returns, NOW)).toHaveLength(0);
  });
  it("excludes items already in a return", () => {
    const o = { ...byNo("BB10421") };
    expect(returnableItems(o, [{ ...returns[0], orderNumber: o.number, itemId: o.items[0].id }], NOW)).toHaveLength(2);
  });
});
