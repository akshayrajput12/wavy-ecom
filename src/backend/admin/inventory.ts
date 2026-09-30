import "server-only";
import type { z } from "zod";
import type { AdminInventoryRow, AdminMovement, Paginated } from "@/types/admin";
import { type Actor, audit, camel, db, fetchAll, maybe, must, pageRange, read, revalidate, userDb, type Db } from "./_shared";
import type { AdjustSchema, InventoryListQuery, MovementsQuery } from "./schemas/ops";

export async function lowStockDefault(c: Db = db()): Promise<number> {
  return maybe(await c.from("store_settings").select("low_stock_default").maybeSingle())?.low_stock_default ?? 3;
}

/**
 * Every variant with its stock. ponytail: full scan joined in memory (fine to ~50k variants);
 * move to a SQL view with a low-stock predicate when the catalog outgrows it.
 */
export async function scanInventory(): Promise<AdminInventoryRow[]> {
  const c = db();
  const [variants, stock, products, fallback] = await Promise.all([
    fetchAll((f, t) => c.from("product_variants").select("id, product_id, sku, title, status, low_stock_threshold, position").order("id").range(f, t)),
    fetchAll((f, t) => c.from("inventory").select("variant_id, on_hand, reserved").order("variant_id").range(f, t)),
    fetchAll((f, t) => c.from("products").select("id, name, slug, status").order("id").range(f, t)),
    lowStockDefault(c),
  ]);
  const inv = new Map(stock.map((s) => [s.variant_id, s]));
  const prod = new Map(products.map((p) => [p.id, p]));
  return variants.flatMap((v) => {
    const p = prod.get(v.product_id);
    if (!p) return [];
    const onHand = inv.get(v.id)?.on_hand ?? 0, reserved = inv.get(v.id)?.reserved ?? 0;
    const threshold = v.low_stock_threshold ?? fallback;
    return [{
      variantId: v.id, productId: p.id, productName: p.name, productSlug: p.slug, productStatus: p.status,
      sku: v.sku, title: v.title, status: v.status, onHand, reserved, available: onHand - reserved, threshold,
      low: v.status !== "disabled" && onHand - reserved <= threshold,
    }];
  });
}

const emptyPage = <T>(page = 1, pageSize = 25): Paginated<T> => ({ items: [], total: 0, page, pageSize });

export const listInventory = (q: z.infer<typeof InventoryListQuery>) =>
  read("inventory.read", emptyPage<AdminInventoryRow>(q.page, q.pageSize), async () => {
    const term = q.q?.toLowerCase();
    const rows = (await scanInventory())
      .filter((r) => !term || r.sku.toLowerCase().includes(term) || r.productName.toLowerCase().includes(term))
      .filter((r) => q.filter === "low" ? r.low && r.available > 0 : q.filter === "out" ? r.status !== "disabled" && r.available <= 0 : true)
      .sort((a, b) => a.available - b.available || a.productName.localeCompare(b.productName));
    const [from] = pageRange(q.page, q.pageSize);
    return { items: rows.slice(from, from + q.pageSize), total: rows.length, page: q.page, pageSize: q.pageSize };
  });

export const listMovements = (variantId: string, q: z.infer<typeof MovementsQuery>) =>
  read("inventory.read", emptyPage<AdminMovement>(q.page, q.pageSize), async () => {
    const [from, to] = pageRange(q.page, q.pageSize);
    const res = await db().from("inventory_movements").select("*", { count: "exact" })
      .eq("variant_id", variantId).order("created_at", { ascending: false }).range(from, to);
    const rows = must(res);
    const actorIds = [...new Set(rows.map((r) => r.actor_id).filter((x): x is string => !!x))];
    const emails = actorIds.length ? must(await db().from("profiles").select("id, email").in("id", actorIds)) : [];
    const byId = new Map(emails.map((e) => [e.id, e.email]));
    return {
      items: rows.map((r) => ({ ...camel(r), actorEmail: r.actor_id ? byId.get(r.actor_id) ?? null : null })),
      total: res.count ?? rows.length, page: q.page, pageSize: q.pageSize,
    };
  });

/** Manual stock change through adjust_inventory (session client: DB re-checks inventory.write and records the actor). */
export async function adjustStock(actor: Actor, input: z.infer<typeof AdjustSchema>) {
  const c = db();
  if (input.idempotencyKey) {
    // ponytail: check-then-write, not atomic; a double click within the same ms can still land twice.
    const prior = must(await c.from("inventory_movements").select("id")
      .eq("reference_type", "manual").eq("reference_id", input.idempotencyKey).limit(1));
    if (prior.length) {
      const inv = must(await c.from("inventory").select("*").eq("variant_id", input.variantId).single());
      return { replayed: true, inventory: camel(inv) };
    }
  }
  const inv = must(await (await userDb()).rpc("adjust_inventory", {
    p_variant_id: input.variantId, p_delta: input.delta, p_reason: input.reason,
    p_note: input.note ?? undefined, p_reference_type: "manual", p_reference_id: input.idempotencyKey,
  }));
  await audit(actor, "inventory.adjust", "inventory", input.variantId, null,
    { delta: input.delta, reason: input.reason, note: input.note ?? null, onHand: inv.on_hand, reserved: inv.reserved });
  revalidate("catalog");
  return { replayed: false, inventory: camel(inv) };
}
