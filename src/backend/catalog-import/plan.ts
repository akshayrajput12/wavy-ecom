import "server-only";
import type { Actor } from "@/backend/admin/_shared";
import { SKU_RE, SLUG_RE } from "@/backend/admin/schemas/rules";
import { type ImportCount, type ImportIssue, type ImportSummary, SHEET_KEYS, SHEETS } from "./columns";
import { defaultSku, planProducts } from "./plan-products";
import { errSink, planCategories, planCollections, slugOf } from "./plan-taxonomy";
import { loadMemberships, loadOwners, loadProducts, loadTaxonomy } from "./repo";
import { readBook } from "./workbook";

/** Document for public.admin_import_catalog (0027): everything below is validated server-side first. */
export interface ImportDoc {
  categories: Record<string, unknown>[];
  collections: Record<string, unknown>[];
  products: { expected_updated_at: string | null; doc: unknown }[];
  memberships: { collection_id: string; product_slug: string }[];
}
export interface ImportPlan { summary: ImportSummary; doc: ImportDoc; created: string[]; updated: string[] }

const MAX_LISTED = 500;
const count = (xs: { isNew: boolean; changed: boolean }[]): ImportCount =>
  ({ new: xs.filter((x) => x.isNew).length, updated: xs.filter((x) => !x.isNew && x.changed).length, unchanged: xs.filter((x) => !x.changed).length });
const order = (i: ImportIssue) => SHEET_KEYS.findIndex((k) => SHEETS[k].name === i.sheet) * 1e6 + i.row;
/** One message per cell (the first is the most specific), in sheet then row order. */
const tidy = (list: ImportIssue[]) => {
  const seen = new Set<string>();
  return list.filter((i) => {
    const key = `${i.sheet}|${i.row}|${i.column || i.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => order(a) - order(b));
};

/** Parse + validate the whole file against the current catalog. Runs for preview and again, from scratch, on commit. */
export async function buildPlan(actor: Actor, buf: ArrayBuffer): Promise<ImportPlan> {
  const book = await readBook(buf);
  const errors: ImportIssue[] = [...book.issues], warnings: ImportIssue[] = [];
  const err = errSink(errors), warn = errSink(warnings);
  const tax = await loadTaxonomy();
  const cats = planCategories(book.categories, tax.categories, new Set([...tax.collections.map((c) => c.slug), ...book.collections.map(slugOf)]), err);
  const cols = planCollections(book.collections, tax.collections, new Set([...tax.categories.map((c) => c.slug), ...book.categories.map(slugOf)]), err);

  const refs = cols.refs.map((r) => r.ref.trim());
  const slugs = [...book.products.map(slugOf), ...book.variants.map((v) => v.product), ...refs].map((s) => s.trim().toLowerCase()).filter((s) => SLUG_RE.test(s));
  const skus = [...book.variants.map((v) => v.sku), ...book.products.map((p) => p.sku ?? defaultSku(slugOf(p))), ...refs]
    .map((s) => s.trim().toUpperCase()).filter((s) => SKU_RE.test(s));
  const barcodes = [...book.products, ...book.variants].flatMap((x) => (x.barcode ? [x.barcode] : []));
  const [existing, owners] = await Promise.all([loadProducts(slugs), loadOwners(skus, barcodes)]);
  const prods = planProducts(book.products, book.variants, { actor, existing, owners, category: cats.resolve, collection: cols.resolve, err, warn });

  // memberships: Products "Collections" column + Collections "Products" column; only additions
  const bySku = new Map(prods.planned.flatMap((p) => p.doc.variants.map((v) => [v.sku, { slug: p.slug, id: p.id }] as const)));
  const product = (ref: string): { slug: string; id: string | null } | string => {
    const lower = ref.trim().toLowerCase(), upper = ref.trim().toUpperCase();
    const inFile = prods.entries.get(lower);
    if (inFile) return { slug: lower, id: inFile.ex?.id ?? null };
    const owner = owners.find((o) => o.sku === upper);
    return bySku.get(upper) ?? (existing.get(lower) ? { slug: lower, id: existing.get(lower)!.id } : owner ? { slug: owner.productSlug, id: owner.productId } : `Unknown product slug or SKU "${ref}"`);
  };
  const pairs = new Map<string, { collection_id: string; product_slug: string; productId: string | null }>();
  const add = (collection_id: string, p: { slug: string; id: string | null }) => pairs.set(`${collection_id}:${p.slug}`, { collection_id, product_slug: p.slug, productId: p.id });
  for (const p of prods.planned) for (const c of p.collectionIds) add(c, p);
  for (const r of cols.refs) {
    const hit = product(r.ref);
    if (typeof hit === "string") err("collections", r.at, "products", hit); else add(r.collectionId, hit);
  }
  const known = await loadMemberships([...new Set([...pairs.values()].map((m) => m.collection_id))].filter((id) => tax.collections.some((c) => c.id === id)));
  const memberships = [...pairs.values()].filter((m) => !m.productId || !known.has(`${m.collection_id}:${m.productId}`));

  const allErrors = tidy(errors);
  const products = prods.planned.filter((p) => p.changed);
  return {
    summary: {
      counts: {
        categories: count(cats.planned), collections: count(cols.planned), products: count(prods.planned),
        variants: prods.planned.reduce((a, p) => ({ new: a.new + p.variants.new, updated: a.updated + p.variants.updated, unchanged: a.unchanged + p.variants.unchanged }),
          { new: 0, updated: 0, unchanged: 0 }),
        memberships: memberships.length,
      },
      errors: allErrors.slice(0, MAX_LISTED), errorCount: allErrors.length, warnings: tidy(warnings).slice(0, MAX_LISTED), imported: false,
    },
    doc: {
      categories: cats.planned.filter((c) => c.changed).map((c) => ({ id: c.id, ...c.row })),
      collections: cols.planned.filter((c) => c.changed).map((c) => ({ id: c.id, ...c.row })),
      products: products.map((p) => ({ expected_updated_at: p.updatedAt, doc: p.doc })),
      memberships: memberships.map(({ collection_id, product_slug }) => ({ collection_id, product_slug })),
    },
    created: products.filter((p) => p.isNew).map((p) => p.slug),
    updated: products.filter((p) => !p.isNew).map((p) => p.slug),
  };
}
