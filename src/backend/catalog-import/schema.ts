/**
 * Cell -> typed row coercion only (rupees -> paise, yes/no, comma lists). The catalog rules themselves
 * (lengths, slugs, SKUs, variants) are enforced by the admin schemas in backend/admin/schemas/catalog.ts.
 */
import { z } from "zod";
import { PRODUCT_STATUS } from "@/types/domain";

const blank = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const opt = <T extends z.ZodType>(s: T) => z.preprocess(blank, s.optional());
const req = <T extends z.ZodType>(s: T) => z.preprocess(blank, s);

const text = z.string({ error: "Required" }).trim().max(50_000);
const str = opt(text);

/** Rupees ("1,499.50", "₹1499") -> integer paise. */
export const toPaise = (raw: string): number | null => {
  const t = raw.replace(/[₹,\s]/g, "").replace(/^rs\.?/i, "");
  return /^\d+(\.\d{1,2})?$/.test(t) ? Math.round(Number(t) * 100) : null;
};
const money = opt(z.string().transform((s, ctx) => {
  const p = toPaise(s);
  if (p === null) { ctx.addIssue({ code: "custom", message: "Enter rupees, e.g. 1499 or 1499.50" }); return z.NEVER; }
  return p;
}));
const int = opt(z.string().trim().regex(/^-?\d+$/, "Enter a whole number").transform(Number));
const YES = new Set(["yes", "y", "true", "1"]);
const NO = new Set(["no", "n", "false", "0"]);
const yesno = opt(z.string().trim().toLowerCase().transform((s, ctx) => {
  if (YES.has(s)) return true;
  if (NO.has(s)) return false;
  ctx.addIssue({ code: "custom", message: "Enter yes or no" });
  return z.NEVER;
}));
const list = opt(z.string().transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean)));

export const CategoryRow = z.object({
  name: req(text), slug: str, parent: str, description: str, showOnHome: yesno, sortOrder: int,
});
export const CollectionRow = z.object({
  name: req(text), slug: str, description: str, active: yesno, products: list,
});
export const ProductRow = z.object({
  name: req(text), slug: str, category: str, collections: list, brand: str, shortDescription: str, description: str,
  material: str, care: str, options: list,
  status: opt(z.string().trim().toLowerCase().pipe(z.enum(PRODUCT_STATUS, { error: `Use ${PRODUCT_STATUS.join(", ")}` }))),
  tags: list, badges: list, hsnCode: str, countryOfOrigin: str, weightGrams: int, returnable: yesno, returnWindowDays: int,
  featured: yesno, sku: str, price: money, compareAt: money, cost: money, stock: int, barcode: str,
});
export const VariantRow = z.object({
  product: req(text), option1: str, option2: str, option3: str, sku: req(text), price: money, compareAt: money, cost: money,
  stock: int, weightGrams: int, barcode: str, colorHex: str,
});

export type CategoryRow = z.infer<typeof CategoryRow>;
export type CollectionRow = z.infer<typeof CollectionRow>;
export type ProductRow = z.infer<typeof ProductRow>;
export type VariantRow = z.infer<typeof VariantRow>;
/** A parsed row plus its spreadsheet row number. */
export type At<T> = T & { row: number };
