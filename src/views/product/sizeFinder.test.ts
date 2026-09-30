import { describe, expect, it } from "vitest";
import { recommendSize, type SizeRow } from "./sizeFinder";

const chart: SizeRow[] = [
  { size: "XS", chest: 86, waist: 71 },
  { size: "S", chest: 94, waist: 79 },
  { size: "M", chest: 102, waist: 87 },
  { size: "L", chest: 110, waist: 95 },
  { size: "XL", chest: 118, waist: 103 },
];
const base = { heightCm: 175, chestCm: 100, waistCm: 84, fit: "regular" as const };

describe("recommendSize", () => {
  it("picks the size that covers chest and waist", () => {
    expect(recommendSize(base, chart)?.size).toBe("M");
  });

  it("uses the larger of chest and waist", () => {
    const r = recommendSize({ ...base, chestCm: 92, waistCm: 90 }, chart);
    expect(r?.size).toBe("L");
    expect(r?.reasons[0]).toMatch(/larger/);
  });

  it("sizes up for relaxed and for tall shoppers", () => {
    expect(recommendSize({ ...base, fit: "relaxed" }, chart)?.size).toBe("L");
    expect(recommendSize({ ...base, heightCm: 190 }, chart)?.size).toBe("L");
  });

  it("sizes down for slim only when close to the smaller size", () => {
    expect(recommendSize({ ...base, chestCm: 95, waistCm: 80, fit: "slim" }, chart)?.size).toBe("S");
    expect(recommendSize({ ...base, fit: "slim" }, chart)?.size).toBe("M");
  });

  it("follows the garment's own fit note and clamps to the chart", () => {
    expect(recommendSize(base, chart, "Oversized fit. Size down for a regular fit.")?.size).toBe("S");
    const big = recommendSize({ ...base, chestCm: 125, waistCm: 110, fit: "relaxed" }, chart);
    expect(big?.size).toBe("XL");
    expect(big?.reasons.at(-1)).toMatch(/closest/);
  });

  it("rejects implausible input", () => {
    expect(recommendSize({ ...base, chestCm: Number.NaN }, chart)).toBeNull();
    expect(recommendSize({ ...base, heightCm: 20 }, chart)).toBeNull();
  });
});
