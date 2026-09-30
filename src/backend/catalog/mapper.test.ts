import { describe, expect, it } from "vitest";
import type { Category } from "@/types/domain";
import { computeFacets, type FacetRow } from "./facets";
import { ancestors, buildTree, descendantIds, toProduct, toSpecifications, type ProductRow } from "./mapper";
import { productQueryFrom, searchTerm } from "./schema";

const row = (over: Partial<ProductRow> = {}): ProductRow => ({
  id: "p1", slug: "tee", name: "Tee", brand: "Acme", short_description: "Soft", highlights: ["Cotton"], tags: ["tee"],
  badges: [], option_names: ["Color", "Size"], category_id: "c2", status: "published", is_featured: false,
  returnable: true, return_window_days: null, price_min: 49900, compare_at_min: 79900, rating_display: 4.5, review_count_display: 12,
  category: { id: "c2", name: "Tops", slug: "tops" },
  variants: [
    { id: "v2", product_id: "p1", sku: "TEE-BLK-L", option1: "Black", option2: "L", option3: null, title: "Black / L", color_hex: "#000000", price: 49900, compare_at_price: null, status: "out_of_stock", position: 2, inventory: { available: 0 } },
    { id: "v1", product_id: "p1", sku: "TEE-BLK-M", option1: "Black", option2: "M", option3: null, title: "Black / M", color_hex: "#000000", price: 49900, compare_at_price: 79900, status: "active", position: 1, inventory: [{ available: 7 }] },
    { id: "v3", product_id: "p1", sku: "TEE-WHT-M", option1: "White", option2: "M", option3: null, title: "White / M", color_hex: null, price: 49900, compare_at_price: null, status: "disabled", position: 3, inventory: null },
  ],
  media: [
    { id: "m2", variant_id: null, option_value: "Black", url: "/black.jpg", alt: "Black tee", width: 800, height: 1000, position: 2, is_primary: false },
    { id: "m1", variant_id: null, option_value: null, url: "/main.jpg", alt: "Tee", width: null, height: null, position: 1, is_primary: true },
  ],
  memberships: [{ collection_id: "col1" }],
  seo_title: "Tee | Shop", seo_description: null, og_image_url: null, canonical_url: null, noindex: false,
  ...over,
});

describe("toProduct", () => {
  it("maps options in option_names order, drops disabled variants, sorts by position", () => {
    const p = toProduct(row());
    expect(p.variants.map((v) => v.id)).toEqual(["v1", "v2"]);
    expect(p.variants[0].options).toEqual([{ name: "Color", value: "Black" }, { name: "Size", value: "M" }]);
    expect(p.variants[0].stock).toBe(7);
    expect(p.variants[1].stock).toBe(0);
    expect(p.variants[0].compareAt).toBe(79900);
  });
  it("puts the primary image first and resolves variant image by option value", () => {
    const p = toProduct(row());
    expect(p.images[0].url).toBe("/main.jpg");
    expect(p.variants[0].image?.url).toBe("/black.jpg");
  });
  it("uses display rating/count, price_min and collection memberships", () => {
    const p = toProduct(row());
    expect([p.rating, p.reviewCount, p.priceFrom, p.compareAtFrom]).toEqual([4.5, 12, 49900, 79900]);
    expect(p.collectionIds).toEqual(["col1"]);
    expect(p.seo).toEqual({ title: "Tee | Shop" });
    expect(p.dimensions).toBeUndefined();
  });
  it("handles products without options and missing embeds", () => {
    const p = toProduct(row({ option_names: [], variants: null, media: null, memberships: null, price_min: null, rating_display: null }));
    expect(p.optionNames).toEqual([]);
    expect(p.variants).toEqual([]);
    expect([p.priceFrom, p.rating]).toEqual([0, 0]);
  });
});

describe("toSpecifications", () => {
  it("keeps valid {group?, label, value} entries and stringifies values", () => {
    expect(toSpecifications([{ group: "Battery", label: "Life", value: 30 }, { label: "Weight", value: "5 g" }, { value: "x" }, null]))
      .toEqual([{ group: "Battery", label: "Life", value: "30" }, { label: "Weight", value: "5 g" }]);
    expect(toSpecifications("nope")).toEqual([]);
  });
});

const cat = (id: string, parentId: string | null, sortOrder = 0): Category => ({
  id, name: id.toUpperCase(), slug: id, parentId, sortOrder, isActive: true, showOnHome: false,
});
const flat = [cat("c1", null, 2), cat("c0", null, 1), cat("c2", "c1"), cat("c3", "c2"), cat("c4", "c1")];

describe("category tree helpers", () => {
  it("builds a sorted tree", () => {
    const tree = buildTree(flat);
    expect(tree.map((c) => c.id)).toEqual(["c0", "c1"]);
    expect(tree[1].children!.map((c) => c.id)).toEqual(["c2", "c4"]);
    expect(tree[1].children![0].children![0].id).toBe("c3");
  });
  it("finds descendants and ancestors", () => {
    expect(descendantIds(flat, "c1").sort()).toEqual(["c1", "c2", "c3", "c4"]);
    expect(ancestors(flat, "c3").map((c) => c.id)).toEqual(["c1", "c2"]);
    expect(ancestors(flat, "c1")).toEqual([]);
  });
});

describe("computeFacets", () => {
  const rows: FacetRow[] = [
    { id: "a", brand: "Acme", category_id: "c3", price_min: 1000, option_names: ["Color"], fv: [{ option1: "Black", option2: null, option3: null, color_hex: "#000" }, { option1: "Red", option2: null, option3: null, color_hex: null }] },
    { id: "b", brand: "Zed", category_id: "c4", price_min: 5000, option_names: ["Color"], fv: [{ option1: "Black", option2: null, option3: null, color_hex: null }] },
    { id: "c", brand: "Acme", category_id: "c2", price_min: null, option_names: [], fv: [] },
  ];
  it("counts categories (incl. descendants), brands, option values and price range", () => {
    const f = computeFacets(rows, flat, "c1");
    expect(f.categories).toEqual([{ id: "c2", slug: "c2", name: "C2", count: 2 }, { id: "c4", slug: "c4", name: "C4", count: 1 }]);
    expect(f.brands).toEqual([{ value: "Acme", count: 2 }, { value: "Zed", count: 1 }]);
    expect(f.options).toEqual([{ name: "Color", values: [{ value: "Black", colorHex: "#000", count: 2 }, { value: "Red", count: 1 }] }]);
    expect(f.price).toEqual({ min: 1000, max: 5000 });
  });
});

describe("product query", () => {
  it("parses repeated params, flags and bad values", () => {
    const q = productQueryFrom(new URLSearchParams("opt=Color:Black&opt=Size:M&brand=Acme&inStock=1&sort=bogus&page=0&min=100"));
    expect(q.opt).toEqual(["Color:Black", "Size:M"]);
    expect(q.brand).toEqual(["Acme"]);
    expect([q.inStock, q.sort, q.page, q.pageSize, q.min]).toEqual([true, "featured", 1, 24, 100]);
  });
  it("sanitises search input for PostgREST", () => {
    expect(searchTerm('ear,buds (pro) "x"')).toBe("ear buds pro x");
  });
});
