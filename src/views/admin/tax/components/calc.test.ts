import { expect, test } from "vitest";
import { gstBreakdown } from "./calc";

test("inclusive and exclusive GST", () => {
  expect(gstBreakdown(112000, 12, true)).toEqual({ base: 100000, tax: 12000, total: 112000, cgst: 6000, sgst: 6000 });
  expect(gstBreakdown(100000, 12, false)).toEqual({ base: 100000, tax: 12000, total: 112000, cgst: 6000, sgst: 6000 });
  const odd = gstBreakdown(99901, 5, true);
  expect(odd.total).toBe(99901);
  expect(odd.cgst + odd.sgst).toBe(odd.tax);
});
