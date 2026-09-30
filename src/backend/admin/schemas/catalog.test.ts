import { describe, expect, it } from "vitest";
import { ProductUpsertSchema } from "./catalog";
import { computePriceFrom, createsCycle, variantIssues } from "./rules";

const base = {
  name: "Wireless Earbuds", slug: "wireless-earbuds", categoryId: "10000000-0000-4000-8000-000000000012",
  optionNames: ["Color"],
  variants: [
    { sku: "ear-blk", options: ["Black"], price: 199900, compareAtPrice: 249900 },
    { sku: "EAR-WHT", options: ["White"], price: 189900 },
  ],
};
const messages = (r: { success: boolean; error?: { issues: { message: string }[] } }) => r.error?.issues.map((i) => i.message) ?? [];

describe("ProductUpsertSchema", () => {
  it("accepts a valid document, uppercases SKUs and fills defaults", () => {
    const p = ProductUpsertSchema.parse(base);
    expect(p.variants.map((v) => v.sku)).toEqual(["EAR-BLK", "EAR-WHT"]);
    expect(p.status).toBe("draft");
    expect(p.media).toEqual([]);
    expect(p.variants[0].disabled).toBe(false);
  });

  it("rejects duplicate SKUs (case-insensitive) and duplicate option combinations", () => {
    const r = ProductUpsertSchema.safeParse({ ...base, variants: [base.variants[0], { ...base.variants[1], sku: "EAR-BLK", options: ["Black"] }] });
    expect(r.success).toBe(false);
    expect(messages(r).join(" ")).toMatch(/used twice/);
    expect(messages(r).join(" ")).toMatch(/duplicated/);
  });

  it("requires one option value per option name", () => {
    const r = ProductUpsertSchema.safeParse({ ...base, variants: [{ sku: "EAR-1", options: [], price: 100 }] });
    expect(messages(r).join(" ")).toMatch(/Expected 1 option value/);
  });

  it("allows exactly one variant when there are no options", () => {
    expect(ProductUpsertSchema.safeParse({ ...base, optionNames: [], variants: [{ sku: "ONE-1", price: 100 }] }).success).toBe(true);
    const r = ProductUpsertSchema.safeParse({ ...base, optionNames: [], variants: [{ sku: "ONE-1", price: 100 }, { sku: "ONE-2", price: 100 }] });
    expect(r.success).toBe(false);
  });

  it("rejects compare-at at or below price, bad slugs and media pointing at unknown SKUs", () => {
    const r = ProductUpsertSchema.safeParse({
      ...base, slug: "Bad Slug",
      variants: [{ sku: "EAR-1", options: ["Black"], price: 500, compareAtPrice: 500 }],
      media: [{ url: "https://x/y.jpg", variantSku: "nope" }],
    });
    const paths = r.error?.issues.map((i) => i.path.join(".")) ?? [];
    expect(paths).toEqual(expect.arrayContaining(["slug", "variants.0", "media.0.variantSku"]));
  });

  it("requires at least one variant and a uuid category", () => {
    const r = ProductUpsertSchema.safeParse({ ...base, categoryId: "electronics", variants: [] });
    const paths = r.error?.issues.map((i) => i.path.join(".")) ?? [];
    expect(paths).toEqual(expect.arrayContaining(["categoryId", "variants"]));
  });
});

describe("computePriceFrom", () => {
  it("uses the cheapest non-disabled variant", () => {
    expect(computePriceFrom([
      { sku: "A-1", options: [], price: 900, disabled: true },
      { sku: "A-2", options: [], price: 1500, compareAtPrice: 2000 },
      { sku: "A-3", options: [], price: 1200 },
    ])).toEqual({ priceFrom: 1200, compareAtFrom: 2000 });
  });
  it("is null when every variant is disabled", () => {
    expect(computePriceFrom([{ sku: "A-1", options: [], price: 900, disabled: true }])).toEqual({ priceFrom: null, compareAtFrom: null });
  });
});

describe("variantIssues", () => {
  it("flags malformed SKUs and duplicate option names", () => {
    const issues = variantIssues(["Size", "size"], [{ sku: "a", options: ["M", "L"], price: 1 }]);
    expect(issues.map((i) => i.message).join(" ")).toMatch(/SKU "a"/);
    expect(issues.some((i) => i.index === -1)).toBe(true);
  });
  it("passes a clean 2-axis matrix", () => {
    expect(variantIssues(["Color", "Size"], [
      { sku: "TEE-BLK-M", options: ["Black", "M"], price: 999 },
      { sku: "TEE-BLK-L", options: ["Black", "L"], price: 999 },
    ])).toEqual([]);
  });
});

describe("createsCycle", () => {
  const tree = new Map<string, string | null>([["root", null], ["a", "root"], ["b", "a"]]);
  it("detects moving a node under its descendant or itself", () => {
    expect(createsCycle(tree, "a", "b")).toBe(true);
    expect(createsCycle(tree, "a", "a")).toBe(true);
  });
  it("allows moving to another branch or to the root", () => {
    expect(createsCycle(tree, "b", "root")).toBe(false);
    expect(createsCycle(tree, "b", null)).toBe(false);
  });
});
