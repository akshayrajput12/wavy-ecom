import "server-only";
import { ApiError } from "@/backend/_core/http";
import type { AdminProduct } from "@/types/admin";
import { dbError } from "@/backend/_core/db";
import type { Json } from "@/types/database";
import { type Actor, assertCan, audit, db, exec, maybe, must, notFound, revalidate, userDb } from "./_shared";
import { loadProduct, slugTaken } from "./products";
import { ProductUpsertSchema, toProductInput, type ProductUpsert } from "./schemas/catalog";
import { computePriceFrom } from "./schemas/rules";

const productRow = (p: ProductUpsert) => ({
  name: p.name, slug: p.slug, category_id: p.categoryId, brand: p.brand ?? null, short_description: p.shortDescription,
  description: p.description, highlights: p.highlights, specifications: p.specifications as unknown as Json, tags: p.tags,
  badges: p.badges, option_names: p.optionNames, size_chart: (p.sizeChart ?? null) as Json, weight_grams: p.weightGrams ?? null,
  length_mm: p.lengthMm ?? null, width_mm: p.widthMm ?? null, height_mm: p.heightMm ?? null, hsn_code: p.hsnCode ?? null,
  country_of_origin: p.countryOfOrigin, warranty: p.warranty ?? null, returnable: p.returnable,
  return_window_days: p.returnWindowDays ?? null, return_policy: p.returnPolicy ?? null, status: p.status,
  is_featured: p.isFeatured, sort_order: p.sortOrder, seo_title: p.seoTitle ?? null, seo_description: p.seoDescription ?? null,
  og_image_url: p.ogImageUrl ?? null, canonical_url: p.canonicalUrl ?? null, noindex: p.noindex ?? false,
});

/** Everything that can be rejected is checked before the first write. */
async function preflight(actor: Actor, p: ProductUpsert, existing: AdminProduct | null) {
  const c = db();
  if (p.status !== (existing?.status ?? "draft")) assertCan(actor, "catalog.publish");
  const taken = p.slug !== existing?.slug ? await slugTaken("product", p.slug, existing?.id) : null;
  if (taken) throw new ApiError(409, "slug_taken", `Slug "${p.slug}" is already used by another product`);
  if (!maybe(await c.from("categories").select("id").eq("id", p.categoryId).maybeSingle())) throw new ApiError(422, "unknown_category", "Category not found");
  const foreign = must(await c.from("product_variants").select("sku, product_id").in("sku", p.variants.map((v) => v.sku)))
    .filter((r) => r.product_id !== existing?.id);
  if (foreign.length) throw new ApiError(409, "sku_taken", `SKU already used by another product: ${foreign.map((r) => r.sku).join(", ")}`, { skus: foreign.map((r) => r.sku) });
  const known = new Set(existing?.variants.map((v) => v.id));
  if (p.variants.some((v) => v.id && !known.has(v.id))) throw new ApiError(422, "unknown_variant", "A variant id does not belong to this product");
  const knownMedia = new Set(existing?.media.map((m) => m.id));
  if (p.media.some((m) => m.id && !knownMedia.has(m.id))) throw new ApiError(422, "unknown_media", "A media id does not belong to this product");
  const rebuild = !!existing?.variants.length && existing.optionNames.length !== p.optionNames.length;
  const keep = new Set(rebuild ? [] : p.variants.map((v) => v.id));
  const held = existing?.variants.filter((v) => !keep.has(v.id) && v.reserved > 0) ?? [];
  if (held.length) throw new ApiError(409, "variant_has_reservations", `Stock is held for open orders on ${held.map((v) => v.sku).join(", ")}`);
}

/** Snake-case product document for admin_upsert_product (0018): one transaction, array order = position. */
const productDoc = (p: ProductUpsert, existing: AdminProduct | null, actor: Actor) => ({
  id: existing?.id ?? null,
  product: { ...productRow(p), created_by: actor.userId },
  variants: p.variants.map((v) => ({
    id: v.id ?? null, sku: v.sku, barcode: v.barcode ?? null, option1: v.options[0] ?? null, option2: v.options[1] ?? null,
    option3: v.options[2] ?? null, color_hex: v.colorHex ?? null, price: v.price, compare_at_price: v.compareAtPrice ?? null,
    cost_price: v.costPrice ?? null, weight_grams: v.weightGrams ?? null, low_stock_threshold: v.lowStockThreshold ?? null,
    disabled: v.disabled, initial_stock: v.initialStock ?? null,
  })),
  media: p.media.map((m) => ({
    id: m.id ?? null, url: m.url, storage_path: m.storagePath ?? null, alt: m.alt, media_type: m.mediaType,
    width: m.width ?? null, height: m.height ?? null, is_primary: !!m.isPrimary, variant_sku: m.variantSku ?? null,
    option_value: m.optionValue ?? null,
  })),
  collection_ids: p.collectionIds,
});

/**
 * Create (no currentSlug) or replace a product document: product row, variants (upsert/delete, SKU swaps),
 * opening stock, media order, collection membership. Validation runs first; the writes are one RPC transaction.
 */
export async function saveProduct(actor: Actor, p: ProductUpsert, currentSlug?: string) {
  const existing = currentSlug ? await loadProduct(currentSlug) : null;
  if (currentSlug && !existing) notFound("Product");
  await preflight(actor, p, existing);
  // session client: auth.uid() + has_permission() apply inside the RPC (opening stock needs inventory.write)
  const res = await (await userDb()).rpc("admin_upsert_product", { p_doc: productDoc(p, existing, actor) as unknown as Json });
  if (res.error) throw dbError(res.error, "save product");
  const { id } = res.data as { id: string; slug: string };
  const keep = new Set(p.media.map((m) => m.id));
  const paths = (existing?.media ?? []).filter((m) => !keep.has(m.id)).map((m) => m.storagePath).filter((x): x is string => !!x);
  if (paths.length) await db().storage.from("product-media").remove(paths);   // best effort: orphans are harmless
  const saved = await loadProduct(p.slug);
  await audit(actor, existing ? "product.update" : "product.create", "products", id, existing, saved);
  revalidate("catalog", "home");
  return { product: saved, ...computePriceFrom(p.variants) };
}

export async function duplicateProduct(actor: Actor, slug: string) {
  const src = await loadProduct(slug);
  if (!src) notFound("Product");
  let n = 1, copySlug = `${src.slug}-copy`;
  while (await slugTaken("product", copySlug)) copySlug = `${src.slug}-copy-${++n}`;
  const base = toProductInput(src);
  const input = ProductUpsertSchema.parse({
    ...base, name: `${src.name} (copy)`.slice(0, 140), slug: copySlug, status: "draft",
    variants: base.variants.map(({ id: _id, ...v }) => ({ ...v, sku: `${v.sku.slice(0, 58)}-C${n}` })),
    media: (base.media ?? []).map(({ id: _id, ...m }) => ({ ...m, storagePath: null, variantSku: m.variantSku ? `${m.variantSku.slice(0, 58)}-C${n}` : null })),
  });
  return saveProduct(actor, input);
}

export async function removeProduct(actor: Actor, slug: string, mode: "archive" | "delete") {
  const c = db();
  const p = await loadProduct(slug);
  if (!p) notFound("Product");
  if (mode === "archive") {
    assertCan(actor, "catalog.publish");
    exec(await c.from("products").update({ status: "archived" }).eq("id", p.id));
  } else {
    const sold = must(await c.from("order_items").select("id").eq("product_id", p.id).limit(1));
    if (sold.length) throw new ApiError(409, "product_has_orders", "This product has orders; archive it instead");
    exec(await c.from("products").delete().eq("id", p.id));
    const paths = p.media.map((m) => m.storagePath).filter((x): x is string => !!x);
    if (paths.length) await c.storage.from("product-media").remove(paths);
  }
  await audit(actor, `product.${mode}`, "products", p.id, p, mode === "archive" ? { ...p, status: "archived" } : null);
  revalidate("catalog", "home");
  return { id: p.id, mode };
}

export async function bulkProductStatus(actor: Actor, ids: string[], status: ProductUpsert["status"]) {
  const rows = must(await db().from("products").update({ status }).in("id", ids).select("id, slug"));
  await audit(actor, "product.bulk_status", "products", null, null, { ids: rows.map((r) => r.id), status });
  revalidate("catalog", "home");
  return { updated: rows.length };
}

export async function setRatingOverride(actor: Actor, slug: string, v: { ratingOverride: number | null; reviewCountOverride: number | null }) {
  const c = db();
  const before = maybe(await c.from("products").select("id, rating_override, review_count_override").eq("slug", slug).maybeSingle());
  if (!before) notFound("Product");
  const after = must(await c.from("products").update({ rating_override: v.ratingOverride, review_count_override: v.reviewCountOverride })
    .eq("id", before.id).select("id, rating_avg, review_count, rating_override, review_count_override, rating_display, review_count_display").single());
  await audit(actor, "product.rating_override", "products", before.id, before, after);
  revalidate("catalog", "home");
  return after;
}
