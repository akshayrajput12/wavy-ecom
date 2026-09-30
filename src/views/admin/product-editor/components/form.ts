import type { DropzoneImage } from "@/components/ui/ImageDropzone";
import type { ProductUpsertInput } from "@/backend/admin/schemas/catalog";
import { slugify } from "@/lib/format";
import type { AdminProduct } from "@/types/admin";
import type { ProductStatus } from "@/types/domain";

/** Form state: rupees and free text as strings. Converted to the paise API document by toPayload. */
export interface VariantForm {
  id?: string; sku: string; barcode: string; options: string[]; price: string; compareAt: string; cost: string;
  weight: string; stock: string; threshold: string; colorHex: string; imageId: string | null; disabled: boolean; onHand?: number;
}
export interface OptionRow { name: string; values: string }
export interface SpecRow { group: string; label: string; value: string }
type MediaInput = NonNullable<ProductUpsertInput["media"]>[number];
export interface EditorForm {
  name: string; slug: string; brand: string; categoryId: string; collectionIds: string[]; status: ProductStatus; isFeatured: boolean;
  badges: string; tags: string; media: DropzoneImage[]; videos: MediaInput[];
  shortDescription: string; description: string; highlights: string; specs: SpecRow[];
  optionRows: OptionRow[]; variants: VariantForm[];
  weightGrams: string; lengthMm: string; widthMm: string; heightMm: string; hsnCode: string; countryOfOrigin: string;
  warranty: string; returnable: boolean; returnWindowDays: string;
  seoTitle: string; seoDescription: string; noindex: boolean; ratingOverride: string; reviewCountOverride: string;
}
export type SetForm = (patch: Partial<EditorForm>) => void;
export interface Uploaded { url: string; path: string; width: number; height: number }

const s = (v: string | number | null | undefined) => (v == null ? "" : String(v));
export const rupees = (p: number | null | undefined) => (p == null ? "" : String(p / 100));
const paise = (v: string) => (v.trim() === "" ? null : Math.round(Number(v) * 100));
const int = (v: string) => (v.trim() === "" ? null : Number(v));
const list = (v: string, sep: RegExp) => v.split(sep).map((x) => x.trim()).filter(Boolean);
export const splitList = (v: string) => list(v, /,/);

export const blankVariant = (): VariantForm => ({
  sku: "", barcode: "", options: [], price: "", compareAt: "", cost: "", weight: "", stock: "0", threshold: "", colorHex: "", imageId: null, disabled: false,
});

export function toForm(p: AdminProduct | null): EditorForm {
  if (!p) {
    return {
      name: "", slug: "", brand: "", categoryId: "", collectionIds: [], status: "draft", isFeatured: false, badges: "", tags: "", media: [], videos: [],
      shortDescription: "", description: "", highlights: "", specs: [], optionRows: [], variants: [blankVariant()],
      weightGrams: "", lengthMm: "", widthMm: "", heightMm: "", hsnCode: "", countryOfOrigin: "India", warranty: "", returnable: true, returnWindowDays: "",
      seoTitle: "", seoDescription: "", noindex: false, ratingOverride: "", reviewCountOverride: "",
    };
  }
  const images = p.media.filter((m) => m.mediaType !== "video").sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  return {
    name: p.name, slug: p.slug, brand: s(p.brand), categoryId: p.categoryId, collectionIds: p.collectionIds, status: p.status, isFeatured: p.isFeatured,
    badges: p.badges.join(", "), tags: p.tags.join(", "),
    media: images.map((m) => ({ id: m.id, url: m.url, alt: m.alt })),
    videos: p.media.filter((m) => m.mediaType === "video").map((m) => ({
      id: m.id, url: m.url, storagePath: m.storagePath, alt: m.alt, mediaType: "video" as const, width: m.width, height: m.height, isPrimary: false, optionValue: m.optionValue,
    })),
    shortDescription: p.shortDescription, description: p.description, highlights: p.highlights.join("\n"),
    specs: p.specifications.map((x) => ({ group: x.group ?? "", label: x.label, value: x.value })),
    optionRows: p.optionNames.map((name, i) => ({ name, values: [...new Set(p.variants.map((v) => v.options[i]))].join(", ") })),
    variants: p.variants.map((v) => ({
      id: v.id, sku: v.sku, barcode: s(v.barcode), options: v.options, price: rupees(v.price), compareAt: rupees(v.compareAtPrice), cost: rupees(v.costPrice),
      weight: s(v.weightGrams), stock: String(v.onHand), threshold: s(v.lowStockThreshold), colorHex: s(v.colorHex),
      imageId: images.find((m) => m.variantId === v.id)?.id ?? null, disabled: v.status === "disabled", onHand: v.onHand,
    })),
    weightGrams: s(p.weightGrams), lengthMm: s(p.lengthMm), widthMm: s(p.widthMm), heightMm: s(p.heightMm), hsnCode: s(p.hsnCode),
    countryOfOrigin: p.countryOfOrigin, warranty: s(p.warranty), returnable: p.returnable, returnWindowDays: s(p.returnWindowDays),
    seoTitle: s(p.seoTitle), seoDescription: s(p.seoDescription), noindex: p.noindex,
    ratingOverride: s(p.ratingOverride), reviewCountOverride: s(p.reviewCountOverride),
  };
}

/** Option axes that are usable (named and with at least one value). */
export function axes(rows: OptionRow[]) {
  const used = rows.map((r) => ({ name: r.name.trim(), values: [...new Set(splitList(r.values))] })).filter((r) => r.name && r.values.length);
  return { names: used.map((r) => r.name), values: used.map((r) => r.values) };
}

export const skuBase = (f: EditorForm) => slugify(f.slug || f.name).replace(/-/g, "").toUpperCase().slice(0, 16) || "SKU";

/** Rebuild the variant matrix from the option rows; keeps rows (with ids and stock) whose option combination survives. */
export function generateVariants(f: EditorForm): VariantForm[] {
  const { values } = axes(f.optionRows);
  const tpl = f.variants[0] ?? blankVariant();
  if (!values.length) return [{ ...tpl, options: [] }];
  const combos = values.reduce<string[][]>((acc, vals) => acc.flatMap((c) => vals.map((v) => [...c, v])), [[]]);
  const keep = new Map(f.variants.map((v) => [v.options.join("\u0000"), v]));
  return combos.map((c) => keep.get(c.join("\u0000")) ?? {
    ...blankVariant(), price: tpl.price, compareAt: tpl.compareAt, cost: tpl.cost, weight: tpl.weight, threshold: tpl.threshold, options: c,
    sku: `${skuBase(f)}-${c.map((x) => x.replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase()).join("-")}`,
  });
}

export const variantsStale = (f: EditorForm) => {
  const { values } = axes(f.optionRows);
  return f.variants.some((v) => v.options.length !== values.length || v.options.some((o, i) => !values[i].includes(o)));
};

export function toPayload(f: EditorForm, orig: AdminProduct | null, up: Record<string, Uploaded>): ProductUpsertInput {
  const base = skuBase(f);
  const skuOf = (v: VariantForm, i: number) => (v.sku.trim() || (f.variants.length > 1 ? `${base}-${i + 1}` : base)).toUpperCase();
  const old = new Map((orig?.media ?? []).map((m) => [m.id, m]));
  const media: MediaInput[] = f.media.map((m, i) => {
    const o = old.get(m.id), u = up[m.id];
    const vi = f.variants.findIndex((v) => v.imageId === m.id);
    return {
      id: o?.id, url: u?.url ?? m.url, storagePath: u?.path ?? o?.storagePath ?? null, alt: m.alt, mediaType: "image" as const,
      width: u?.width || o?.width || undefined, height: u?.height || o?.height || undefined, isPrimary: i === 0,
      variantSku: vi >= 0 ? skuOf(f.variants[vi], vi) : null, optionValue: vi >= 0 ? null : o?.optionValue ?? null,
    };
  });
  return {
    name: f.name.trim(), slug: f.slug.trim(), categoryId: f.categoryId, brand: f.brand.trim() || null,
    shortDescription: f.shortDescription, description: f.description, highlights: list(f.highlights, /\n/),
    specifications: f.specs.filter((x) => x.label.trim() || x.value.trim()).map((x) => ({ group: x.group.trim() || undefined, label: x.label, value: x.value })),
    tags: splitList(f.tags), badges: splitList(f.badges), optionNames: axes(f.optionRows).names,
    weightGrams: int(f.weightGrams), lengthMm: int(f.lengthMm), widthMm: int(f.widthMm), heightMm: int(f.heightMm),
    hsnCode: f.hsnCode.trim() || null, countryOfOrigin: f.countryOfOrigin, warranty: f.warranty.trim() || null,
    returnable: f.returnable, returnWindowDays: f.returnable ? int(f.returnWindowDays) : null,
    status: f.status, isFeatured: f.isFeatured, seoTitle: f.seoTitle.trim() || null, seoDescription: f.seoDescription.trim() || null, noindex: f.noindex,
    collectionIds: f.collectionIds,
    variants: f.variants.map((v, i) => ({
      id: v.id, sku: skuOf(v, i), barcode: v.barcode.trim() || null, options: v.options, colorHex: v.colorHex.trim() || null,
      price: paise(v.price) ?? 0, compareAtPrice: paise(v.compareAt), costPrice: paise(v.cost), weightGrams: int(v.weight),
      lowStockThreshold: int(v.threshold), disabled: v.disabled, initialStock: v.id ? undefined : int(v.stock) ?? 0,
    })),
    media: [...media, ...f.videos],
  };
}

export const ratingBody = (f: EditorForm) => ({ ratingOverride: int(f.ratingOverride), reviewCountOverride: int(f.reviewCountOverride) });
