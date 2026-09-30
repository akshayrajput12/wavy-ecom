/** Pure option/variant selection for any product shape (0-3 option axes). Covered by variantSelect.test.ts. */
import type { Product, ProductVariant } from "@/types/domain";

export type Selection = Record<string, string>;
export interface OptionChoice { value: string; colorHex?: string; available: boolean }

export const isColorAxis = (name: string) => /colou?r|shade/i.test(name);
export const inStock = (v: ProductVariant) => v.stock > 0 && v.status === "active";

const optionOf = (v: ProductVariant, name: string) => v.options.find((o) => o.name === name)?.value;
const matches = (v: ProductVariant, sel: Selection) => Object.entries(sel).every(([n, val]) => optionOf(v, n) === val);
const selectionOf = (v: ProductVariant): Selection => Object.fromEntries(v.options.map((o) => [o.name, o.value]));

/** First in-stock variant (else the first variant), fully selected. */
export function initialSelection(p: Product): Selection {
  const v = p.variants.find(inStock) ?? p.variants[0];
  return v ? selectionOf(v) : {};
}

/** Variant matching every axis of the selection (the only variant for option-less products). */
export function findVariant(p: Product, sel: Selection): ProductVariant | undefined {
  if (!p.optionNames.length) return p.variants[0];
  return p.variants.find((v) => p.optionNames.every((n) => optionOf(v, n) === sel[n]));
}

/** Distinct values of one axis; `available` = some in-stock variant has it together with the other selected values. */
export function choicesFor(p: Product, name: string, sel: Selection): OptionChoice[] {
  const others = Object.fromEntries(Object.entries(sel).filter(([n]) => n !== name));
  const color = isColorAxis(name);
  const out = new Map<string, OptionChoice>();
  for (const v of p.variants) {
    const value = optionOf(v, name);
    if (!value) continue;
    const c = out.get(value) ?? { value, available: false };
    if (color && !c.colorHex && v.colorHex) c.colorHex = v.colorHex;
    if (inStock(v) && matches(v, others)) c.available = true;
    out.set(value, c);
  }
  return [...out.values()];
}

/**
 * Picks `value` on axis `name`. If that combination doesn't exist, jumps to the closest real variant
 * with the new value (in-stock first) so the shopper never lands on an impossible selection.
 */
export function selectOption(p: Product, sel: Selection, name: string, value: string): Selection {
  const next = { ...sel, [name]: value };
  if (findVariant(p, next)) return next;
  const withValue = p.variants.filter((v) => optionOf(v, name) === value);
  const best = withValue.find(inStock) ?? withValue[0];
  return best ? selectionOf(best) : next;
}

/** Colour swatches for cards: only when the product has a colour axis. */
export function swatchesOf(p: Product): { value: string; colorHex?: string }[] {
  const axis = p.optionNames.find(isColorAxis);
  return axis ? choicesFor(p, axis, {}).map(({ value, colorHex }) => ({ value, colorHex })) : [];
}

export const totalStock = (p: Product) => p.variants.reduce((n, v) => n + (inStock(v) ? v.stock : 0), 0);
