import "server-only";
import { can } from "@/backend/_core/permissions";
import type { Actor } from "@/backend/admin/_shared";
import { productDoc } from "@/backend/admin/product-save";
import { ProductUpsertSchema, toProductInput, type ProductUpsertInput } from "@/backend/admin/schemas/catalog";
import { SLUG_RE } from "@/backend/admin/schemas/rules";
import type { AdminProduct } from "@/types/admin";
import type { ImportCount, SheetKey } from "./columns";
import { type Err, resolver, slugOf } from "./plan-taxonomy";
import type { Owner } from "./repo";
import type { At, ProductRow, VariantRow } from "./schema";

type VariantIn = ProductUpsertInput["variants"][number];
type Src = { sheet: SheetKey; row: number };
type Ref = { id: string; slug: string } | string;
export interface ProductCtx {
  actor: Actor; existing: Map<string, AdminProduct>; owners: Owner[];
  category: (ref: string) => Ref; collection: (ref: string) => Ref; err: Err; warn: Err;
}
export interface PlannedProduct {
  slug: string; id: string | null; updatedAt: string | null; isNew: boolean; changed: boolean;
  doc: ReturnType<typeof productDoc>; variants: ImportCount; collectionIds: string[];
}

const VAR_COL: Record<string, string> = { compareAtPrice: "compareAt", costPrice: "cost", initialStock: "stock", options: "option1" };
const PROD_COL: Record<string, string> = { variants: "price", categoryId: "category", optionNames: "options", isFeatured: "featured", specifications: "material", collectionIds: "collections" };
/** Drop undefined keys so a blank cell keeps the current value. */
const defined = <T extends object>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
export const defaultSku = (slug: string) => slug.toUpperCase().slice(0, 64).replace(/-+$/, "");
const hasSingle = (r: ProductRow) => [r.sku, r.price, r.compareAt, r.cost, r.stock, r.barcode].some((v) => v !== undefined);

/** Material / Care columns replace (or add) the specification with that label. */
function withSpecs(specs: NonNullable<ProductUpsertInput["specifications"]>, add: Record<string, string | undefined>) {
  const out = [...specs];
  for (const [label, value] of Object.entries(add)) {
    if (value === undefined) continue;
    const i = out.findIndex((s) => s.label.toLowerCase() === label.toLowerCase());
    if (i >= 0) out[i] = { ...out[i], value }; else out.push({ label, value });
  }
  return out;
}

export function planProducts(rows: At<ProductRow>[], vrows: At<VariantRow>[], ctx: ProductCtx) {
  const entries = new Map<string, { r?: At<ProductRow>; ex?: AdminProduct; variants: At<VariantRow>[] }>();
  for (const r of rows) {
    const slug = slugOf(r);
    if (!SLUG_RE.test(slug)) { ctx.err("products", r.row, r.slug ? "slug" : "name", r.slug ? "Use lowercase letters, numbers and single hyphens" : "Can't make a slug from this name: fill in Slug"); continue; }
    const dup = entries.get(slug)?.r;
    if (dup) { ctx.err("products", r.row, r.slug ? "slug" : "name", `Same slug "${slug}" as row ${dup.row}`); continue; }
    entries.set(slug, { r, ex: ctx.existing.get(slug), variants: [] });
  }
  const byName = resolver("product", [...entries].map(([slug, e]) => ({ id: slug, slug, name: e.r?.name ?? slug })));
  for (const v of vrows) {
    const hit = byName(v.product);
    const slug = typeof hit === "string" ? (ctx.existing.has(v.product.trim().toLowerCase()) ? v.product.trim().toLowerCase() : null) : hit.slug;
    if (!slug) { ctx.err("variants", v.row, "product", typeof hit === "string" ? hit : ""); continue; }
    if (!entries.has(slug)) entries.set(slug, { ex: ctx.existing.get(slug), variants: [] });
    entries.get(slug)!.variants.push(v);
  }
  const seenSku = new Map<string, Src>(), seenBarcode = new Map<string, Src>();
  const planned = [...entries].flatMap(([slug, e]) => planOne(slug, e, ctx, seenSku, seenBarcode) ?? []);
  return { planned, entries };
}

function planOne(slug: string, e: { r?: At<ProductRow>; ex?: AdminProduct; variants: At<VariantRow>[] }, ctx: ProductCtx,
  seenSku: Map<string, Src>, seenBarcode: Map<string, Src>): PlannedProduct | null {
  const { r, ex } = e;
  const home: Src = r ? { sheet: "products", row: r.row } : { sheet: "variants", row: e.variants[0].row };
  const at = (s: Src | null | undefined, col: string, msg: string) => ctx.err((s ?? home).sheet, (s ?? home).row, s ? col : "", msg);
  const P = (col: string, msg: string) => ctx.err(home.sheet, home.row, r ? col : "", msg);
  const base: ProductUpsertInput = ex ? { ...toProductInput(ex), media: [] } : { name: r?.name ?? slug, slug, categoryId: "", variants: [] };
  const input: ProductUpsertInput = { ...base };
  const collectionIds: string[] = [];
  if (r) {
    if (r.category) {
      const c = ctx.category(r.category);
      if (typeof c === "string") P("category", c); else input.categoryId = c.id;
    } else if (!ex) P("category", "Required for a new product");
    for (const ref of r.collections ?? []) {
      const c = ctx.collection(ref);
      if (typeof c === "string") P("collections", c); else collectionIds.push(c.id);
    }
    Object.assign(input, defined({
      name: r.name, brand: r.brand, shortDescription: r.shortDescription, description: r.description, tags: r.tags, badges: r.badges,
      optionNames: r.options, status: r.status, hsnCode: r.hsnCode, countryOfOrigin: r.countryOfOrigin, weightGrams: r.weightGrams,
      returnable: r.returnable, returnWindowDays: r.returnWindowDays, isFeatured: r.featured,
    }));
    input.specifications = withSpecs(base.specifications ?? [], { Material: r.material, Care: r.care });
  }
  const optionCount = (input.optionNames ?? []).length;
  if (ex?.variants.length && optionCount !== ex.optionNames.length) P("options", "The number of options can't change here: use the product editor");

  const variants: VariantIn[] = base.variants.map((v) => ({ ...v }));
  const src: (Src | null)[] = variants.map(() => null);
  const put = (s: Src, sku: string, patch: Partial<VariantIn>, opts: string[], stock: number | undefined, price: number | undefined) => {
    const i = variants.findIndex((x) => x.sku.toUpperCase() === sku);
    if (i >= 0 && src[i]) ctx.err(s.sheet, s.row, "sku", `Same SKU as ${src[i]!.sheet} row ${src[i]!.row}`);
    else if (i >= 0) {
      variants[i] = { ...variants[i], ...patch, ...(opts.length ? { options: opts } : {}) };
      src[i] = s;
      if (stock !== undefined) ctx.warn(s.sheet, s.row, "stock", "Ignored: opening stock only applies to new variants. Change stock in Inventory.");
    } else {
      if (price === undefined) ctx.err(s.sheet, s.row, "price", "Required for a new variant");
      variants.push({ sku, options: opts, disabled: false, initialStock: stock ?? 0, ...patch, price: price ?? 0 });
      src.push(s);
    }
  };
  for (const v of e.variants) {
    const patch = defined({ price: v.price, compareAtPrice: v.compareAt, costPrice: v.cost, weightGrams: v.weightGrams, barcode: v.barcode, colorHex: v.colorHex });
    put({ sheet: "variants", row: v.row }, v.sku.toUpperCase(), patch, [v.option1, v.option2, v.option3].filter((o): o is string => !!o), v.stock, v.price);
  }
  if (!e.variants.length && r && hasSingle(r)) {
    if (optionCount) P("price", "This product has options: put its prices on the Variants sheet");
    else if (variants.length && r.sku && r.sku.toUpperCase() !== variants[0].sku) P("sku", `This product's SKU is ${variants[0].sku}: rename SKUs in the product editor`);
    else {
      const sku = variants[0]?.sku ?? (r.sku ?? defaultSku(slug)).toUpperCase();
      put(home, sku, defined({ price: r.price, compareAtPrice: r.compareAt, costPrice: r.cost, barcode: r.barcode }), [], r.stock, r.price);
    }
  } else if (!variants.length && r) {
    P(optionCount ? "options" : "price", optionCount ? "Add this product's variants on the Variants sheet" : "Add a Price, or this product's rows on the Variants sheet");
  }
  input.variants = variants;

  const res = ProductUpsertSchema.safeParse(input);
  if (!res.success) {
    for (const i of res.error.issues) {
      const [k, idx, field] = i.path.map(String);
      if (k === "variants" && idx !== undefined) at(src[Number(idx)] ?? (r ? null : home), VAR_COL[field ?? ""] ?? field ?? "", i.message);
      else P(PROD_COL[k] ?? k ?? "", i.message);
    }
    return null;
  }
  const p = res.data;
  if (p.status !== (ex?.status ?? "draft") && !can(ctx.actor.role, "catalog.publish")) P("status", "Changing the status needs the catalog.publish permission");
  p.variants.forEach((v, i) => {
    const s = src[i];
    if (!v.id && (v.initialStock ?? 0) > 0 && !can(ctx.actor.role, "inventory.write")) at(s, "stock", "Opening stock needs the inventory.write permission");
    const owner = ctx.owners.find((o) => o.sku === v.sku);
    if (owner && owner.productId !== ex?.id) at(s, "sku", `SKU ${v.sku} already belongs to product "${owner.productSlug}"`);
    const taken = v.barcode ? ctx.owners.find((o) => o.barcode === v.barcode) : undefined;
    if (taken && taken.productId !== ex?.id) at(s, "barcode", `Barcode already used by SKU ${taken.sku}`);
    if (!s) return;
    const dupSku = seenSku.get(v.sku);
    if (dupSku) at(s, "sku", `SKU ${v.sku} is also on ${dupSku.sheet} row ${dupSku.row}`); else seenSku.set(v.sku, s);
    const dupBarcode = v.barcode ? seenBarcode.get(v.barcode) : undefined;
    if (dupBarcode) at(s, "barcode", `Barcode is also on ${dupBarcode.sheet} row ${dupBarcode.row}`); else if (v.barcode) seenBarcode.set(v.barcode, s);
  });

  const doc = productDoc(p, ex ?? null, ctx.actor);
  const before = ex ? ProductUpsertSchema.safeParse({ ...toProductInput(ex), media: [] }) : null;
  const prev = new Map((before?.success ? before.data.variants : []).map((v) => [v.id, JSON.stringify(v)]));
  const vNew = p.variants.filter((v) => !v.id).length;
  const vUpdated = p.variants.filter((v) => v.id && prev.get(v.id) !== JSON.stringify(v)).length;
  const sameRow = !!before?.success && JSON.stringify(productDoc(before.data, ex ?? null, ctx.actor).product) === JSON.stringify(doc.product);
  return {
    slug: p.slug, id: ex?.id ?? null, updatedAt: ex?.updatedAt ?? null, isNew: !ex, changed: !ex || !sameRow || vNew + vUpdated > 0, doc, collectionIds,
    variants: { new: vNew, updated: vUpdated, unchanged: p.variants.length - vNew - vUpdated },
  };
}
