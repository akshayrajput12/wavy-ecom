import { describe, expect, it } from "vitest";
import type { Product, ProductVariant } from "@/types/domain";
import { choicesFor, findVariant, initialSelection, selectOption, swatchesOf } from "./variantSelect";

const v = (id: string, color: string, size: string, stock: number, colorHex?: string): ProductVariant => ({
  id, productId: "p", sku: id, title: `${color} / ${size}`, price: 1000, stock, status: stock ? "active" : "out_of_stock", colorHex,
  options: [{ name: "Color", value: color }, { name: "Size", value: size }],
});
const product = (variants: ProductVariant[], optionNames = ["Color", "Size"]) =>
  ({ id: "p", optionNames, variants } as unknown as Product);

const p = product([v("a", "Black", "S", 0, "#000"), v("b", "Black", "M", 3, "#000"), v("c", "White", "S", 2, "#fff")]);

describe("variant selection", () => {
  it("starts on the first in-stock variant", () => {
    expect(initialSelection(p)).toEqual({ Color: "Black", Size: "M" });
  });

  it("finds the exact variant, or the only one for option-less products", () => {
    expect(findVariant(p, { Color: "White", Size: "S" })?.id).toBe("c");
    expect(findVariant(p, { Color: "White", Size: "M" })).toBeUndefined();
    expect(findVariant(product([v("x", "-", "-", 1)], []), {})?.id).toBe("x");
  });

  it("marks values unavailable against the other selected axes", () => {
    const sizes = choicesFor(p, "Size", { Color: "Black", Size: "M" });
    expect(sizes).toEqual([{ value: "S", available: false }, { value: "M", available: true }]);
    expect(choicesFor(p, "Size", { Color: "White" }).find((c) => c.value === "S")?.available).toBe(true);
  });

  it("jumps to a real variant when the combination doesn't exist", () => {
    expect(selectOption(p, { Color: "Black", Size: "M" }, "Color", "White")).toEqual({ Color: "White", Size: "S" });
    expect(selectOption(p, { Color: "White", Size: "S" }, "Color", "Black")).toEqual({ Color: "Black", Size: "S" });
  });

  it("only shows swatches when a colour axis exists", () => {
    expect(swatchesOf(p)).toEqual([{ value: "Black", colorHex: "#000" }, { value: "White", colorHex: "#fff" }]);
    expect(swatchesOf(product(p.variants, ["Storage"]))).toEqual([]);
  });
});
