import "server-only";
import type { z } from "zod";
import type { AdminCoupon, AdminOffer, DiscountTarget, RedemptionStats } from "@/types/admin";
import type { Json, Tables, TablesInsert, TablesUpdate } from "@/types/database";
import { type Actor, audit, camel, db, exec, fetchAll, maybe, must, notFound, read, revalidate, snake } from "./_shared";
import type { BulkCouponStatusSchema, CouponPatchSchema, CouponSchema, DiscountTargetInput, OfferPatchSchema, OfferSchema } from "./schemas/marketing";

type Owner = { coupon_id: string } | { offer_id: string };
const COL = { product: "product_id", variant: "variant_id", category: "category_id", collection: "collection_id" } as const;

const toTargetRows = (owner: Owner, targets: DiscountTargetInput[]): TablesInsert<"discount_targets">[] =>
  targets.map((t) => ({ ...owner, mode: t.mode, [COL[t.kind]]: t.id }));

function fromTargetRow(r: Tables<"discount_targets">): DiscountTarget {
  const kind = (Object.keys(COL) as (keyof typeof COL)[]).find((k) => r[COL[k]])!;
  return { mode: r.mode, kind, id: r[COL[kind]]! };
}

async function replaceTargets(owner: Owner, targets: DiscountTargetInput[]) {
  const c = db();
  const [col, id] = Object.entries(owner)[0] as ["coupon_id" | "offer_id", string];
  exec(await c.from("discount_targets").delete().eq(col, id));
  if (targets.length) exec(await c.from("discount_targets").insert(toTargetRows(owner, targets)));
}

function tally(rows: { status: Tables<"coupon_redemptions">["status"]; discount_amount: number }[]): RedemptionStats {
  const s: RedemptionStats = { applied: 0, reserved: 0, reversed: 0, discountGiven: 0 };
  for (const r of rows) { s[r.status]++; if (r.status === "applied") s.discountGiven += r.discount_amount; }
  return s;
}

// ---------- Coupons ----------
async function hydrateCoupons(rows: Tables<"coupons">[]): Promise<AdminCoupon[]> {
  const c = db();
  const ids = rows.map((r) => r.id);
  if (!ids.length) return [];
  const [targets, redemptions] = await Promise.all([
    c.from("discount_targets").select("*").in("coupon_id", ids).then(must),
    fetchAll((f, t) => c.from("coupon_redemptions").select("coupon_id, status, discount_amount").in("coupon_id", ids).order("id").range(f, t)),
  ]);
  return rows.map((r) => ({
    ...camel(r),
    targets: targets.filter((t) => t.coupon_id === r.id).map(fromTargetRow),
    stats: tally(redemptions.filter((x) => x.coupon_id === r.id)),
  }));
}

export const listCoupons = () => read("marketing.read", [] as AdminCoupon[], async () =>
  hydrateCoupons(must(await db().from("coupons").select("*").order("created_at", { ascending: false }))));

async function loadCoupon(id: string) {
  const row = maybe(await db().from("coupons").select("*").eq("id", id).maybeSingle());
  return row ? (await hydrateCoupons([row]))[0] : null;
}
export const getCoupon = (id: string) => read("marketing.read", null, () => loadCoupon(id));

export async function createCoupon(actor: Actor, { targets = [], ...input }: z.infer<typeof CouponSchema>) {
  const c = db();
  const row = must(await c.from("coupons").insert({ ...snake<TablesInsert<"coupons">>(input), value: input.value ?? 0, created_by: actor.userId }).select("*").single());
  try { await replaceTargets({ coupon_id: row.id }, targets); } catch (e) { await c.from("coupons").delete().eq("id", row.id); throw e; }
  const after = await loadCoupon(row.id);
  await audit(actor, "coupon.create", "coupons", row.id, null, after);
  revalidate("home");
  return after;
}

export async function updateCoupon(actor: Actor, id: string, { targets, ...input }: z.infer<typeof CouponPatchSchema>) {
  const before = await loadCoupon(id);
  if (!before) notFound("Coupon");
  if (Object.keys(input).length) exec(await db().from("coupons").update(snake<TablesUpdate<"coupons">>(input)).eq("id", id));
  if (targets) await replaceTargets({ coupon_id: id }, targets);
  const after = await loadCoupon(id);
  await audit(actor, "coupon.update", "coupons", id, before, after);
  revalidate("home");
  return after;
}

export async function bulkCouponStatus(actor: Actor, { ids, status }: z.infer<typeof BulkCouponStatusSchema>) {
  const rows = must(await db().from("coupons").update({ status }).in("id", ids).select("id"));
  await audit(actor, "coupon.bulk_status", "coupons", null, null, { ids: rows.map((r) => r.id), status });
  revalidate("home");
  return { updated: rows.length };
}

// ---------- Offers (tiers are stored as [{min_qty, percent}] for compute_pricing) ----------
type Tier = { minQty: number; percent: number };
const tiersIn = (t: Tier[] | null | undefined) => t === undefined ? undefined : t && (t.map((x) => ({ min_qty: x.minQty, percent: x.percent })) as Json);
const tiersOut = (t: Json | null): Tier[] | null =>
  Array.isArray(t) ? t.map((x) => { const o = x as { min_qty?: number; percent?: number }; return { minQty: Number(o.min_qty), percent: Number(o.percent) }; }) : null;

async function hydrateOffers(rows: Tables<"offers">[]): Promise<AdminOffer[]> {
  const c = db();
  const ids = rows.map((r) => r.id);
  if (!ids.length) return [];
  const [targets, redemptions] = await Promise.all([
    c.from("discount_targets").select("*").in("offer_id", ids).then(must),
    fetchAll((f, t) => c.from("offer_redemptions").select("offer_id, status, discount_amount").in("offer_id", ids).order("id").range(f, t)),
  ]);
  return rows.map((r) => ({
    ...camel(r), tiers: tiersOut(r.tiers),
    targets: targets.filter((t) => t.offer_id === r.id).map(fromTargetRow),
    stats: tally(redemptions.filter((x) => x.offer_id === r.id)),
  }));
}

export const listOffers = () => read("marketing.read", [] as AdminOffer[], async () =>
  hydrateOffers(must(await db().from("offers").select("*").order("priority", { ascending: false }).order("created_at", { ascending: false }))));

async function loadOffer(id: string) {
  const row = maybe(await db().from("offers").select("*").eq("id", id).maybeSingle());
  return row ? (await hydrateOffers([row]))[0] : null;
}
export const getOffer = (id: string) => read("marketing.read", null, () => loadOffer(id));

export async function createOffer(actor: Actor, { targets = [], tiers, ...input }: z.infer<typeof OfferSchema>) {
  const c = db();
  const row = must(await c.from("offers").insert({ ...snake<TablesInsert<"offers">>(input), tiers: tiersIn(tiers) ?? null, created_by: actor.userId }).select("*").single());
  try { await replaceTargets({ offer_id: row.id }, targets); } catch (e) { await c.from("offers").delete().eq("id", row.id); throw e; }
  const after = await loadOffer(row.id);
  await audit(actor, "offer.create", "offers", row.id, null, after);
  revalidate("catalog", "home");
  return after;
}

export async function updateOffer(actor: Actor, id: string, { targets, tiers, ...input }: z.infer<typeof OfferPatchSchema>) {
  const before = await loadOffer(id);
  if (!before) notFound("Offer");
  const patch = { ...snake<TablesUpdate<"offers">>(input), ...(tiers !== undefined ? { tiers: tiersIn(tiers) } : {}) };
  if (Object.keys(patch).length) exec(await db().from("offers").update(patch).eq("id", id));
  if (targets) await replaceTargets({ offer_id: id }, targets);
  const after = await loadOffer(id);
  await audit(actor, "offer.update", "offers", id, before, after);
  revalidate("catalog", "home");
  return after;
}
