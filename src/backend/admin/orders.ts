import "server-only";
import type { z } from "zod";
import { ApiError } from "@/backend/_core/http";
import type { AdminOrderDetail, AdminOrderRow, Paginated } from "@/types/admin";
import type { Tables } from "@/types/database";
import type { OrderStatus } from "@/types/domain";
import { type Actor, audit, camel, db, exec, maybe, must, notFound, pageRange, read, searchTerm, userDb } from "./_shared";
import type { OrderListQuery } from "./schemas/ops";
import { ORDER_TRANSITIONS } from "./schemas/rules";

const ROW_COLS = "id, order_number, status, payment_status, payment_provider, customer_name, email, phone, total, placed_at" as const;
type OrderRowSource = Pick<Tables<"orders">, "id" | "order_number" | "status" | "payment_status" | "payment_provider" | "customer_name" | "email" | "phone" | "total" | "placed_at">;

/** Adds item counts; shared by orders, customers and the dashboard. */
export async function toOrderRows(rows: OrderRowSource[]): Promise<AdminOrderRow[]> {
  const items = rows.length ? must(await db().from("order_items").select("order_id, quantity").in("order_id", rows.map((r) => r.id))) : [];
  const count = new Map<string, number>();
  for (const i of items) count.set(i.order_id, (count.get(i.order_id) ?? 0) + i.quantity);
  return rows.map((r) => ({
    id: r.id, orderNumber: r.order_number, status: r.status, paymentStatus: r.payment_status, paymentProvider: r.payment_provider,
    customerName: r.customer_name, email: r.email, phone: r.phone, total: r.total, itemCount: count.get(r.id) ?? 0, placedAt: r.placed_at,
  }));
}

export const listOrders = (q: z.infer<typeof OrderListQuery>) =>
  read("orders.read", { items: [], total: 0, page: q.page, pageSize: q.pageSize } as Paginated<AdminOrderRow>, async () => {
    const term = searchTerm(q.q);
    const [from, to] = pageRange(q.page, q.pageSize);
    let b = db().from("orders").select(ROW_COLS, { count: "exact" }).order("placed_at", { ascending: false });
    if (q.status) b = b.eq("status", q.status);
    if (q.paymentStatus) b = b.eq("payment_status", q.paymentStatus);
    if (q.provider) b = b.eq("payment_provider", q.provider);
    if (q.from) b = b.gte("placed_at", q.from);
    if (q.to) b = b.lt("placed_at", q.to);
    if (term) b = b.or(["order_number", "email", "phone", "customer_name"].map((k) => `${k}.ilike."%${term}%"`).join(","));
    const res = await b.range(from, to);
    return { items: await toOrderRows(must(res)), total: res.count ?? 0, page: q.page, pageSize: q.pageSize };
  });

export async function orderByNumber(number: string) {
  const o = maybe(await db().from("orders").select("*").eq("order_number", number).maybeSingle());
  if (!o) notFound("Order");
  return o;
}

export async function loadOrder(number: string): Promise<AdminOrderDetail | null> {
  const c = db();
  const o = maybe(await c.from("orders").select("*").eq("order_number", number).maybeSingle());
  if (!o) return null;
  const [items, payments, attempts, events, refunds, shipments, history, notes, returns] = await Promise.all([
    c.from("order_items").select("*").eq("order_id", o.id).order("created_at").then(must),
    c.from("payments").select("*").eq("order_id", o.id).order("created_at").then(must),
    c.from("payment_attempts").select("*").eq("order_id", o.id).order("started_at").then(must),
    c.from("payment_events").select("*").eq("order_id", o.id).order("received_at").then(must),
    c.from("refunds").select("*").eq("order_id", o.id).order("created_at").then(must),
    c.from("shipments").select("*").eq("order_id", o.id).order("created_at").then(must),
    c.from("order_status_history").select("*").eq("order_id", o.id).order("created_at").then(must),
    c.from("audit_logs").select("id, created_at, actor_email, after").eq("action", "order.note").eq("entity_id", o.id).order("created_at").then(must),
    c.from("return_requests").select("*").eq("order_id", o.id).order("created_at").then(must),
  ]);
  const shipIds = shipments.map((s) => s.id), retIds = returns.map((r) => r.id);
  const [shipItems, shipEvents, retItems] = await Promise.all([
    shipIds.length ? c.from("shipment_items").select("*").in("shipment_id", shipIds).then(must) : [],
    shipIds.length ? c.from("shipment_events").select("*").in("shipment_id", shipIds).order("occurred_at").then(must) : [],
    retIds.length ? c.from("return_items").select("*").in("return_request_id", retIds).then(must) : [],
  ]);
  const dupes = new Set(attempts.filter((a) => a.status === "duplicate" || a.status === "failed").map((a) => a.id));
  const refunded = refunds.filter((r) => r.status !== "failed" && !(r.attempt_id && dupes.has(r.attempt_id))).reduce((s, r) => s + r.amount, 0);
  return {
    ...camel(o),
    items: items.map(camel), payments: payments.map(camel), attempts: attempts.map(camel), events: events.map(camel),
    refunds: refunds.map(camel), history: history.map(camel),
    shipments: shipments.map((s) => ({
      ...camel(s), items: shipItems.filter((i) => i.shipment_id === s.id).map(camel), events: shipEvents.filter((e) => e.shipment_id === s.id).map(camel),
    })),
    returns: returns.map((r) => ({ ...camel(r), items: retItems.filter((i) => i.return_request_id === r.id).map(camel) })),
    staffNotes: notes.map((n) => ({ id: n.id, at: n.created_at, author: n.actor_email, body: String((n.after as { body?: unknown } | null)?.body ?? "") })),
    refundable: Math.max(0, payments.reduce((s, p) => s + p.amount_captured, 0) - refunded),
    allowedTransitions: ORDER_TRANSITIONS[o.status],
  };
}

export const getOrder = (number: string) => read("orders.read", null, () => loadOrder(number));

/**
 * Status change through the session client, so order_status_history records the staff actor and
 * the DB trigger (order_status_allowed) stays the authority. Cancellation goes through cancel_order.
 */
export async function setOrderStatus(actor: Actor, number: string, status: OrderStatus, note?: string | null) {
  if (status === "cancelled") return cancelOrder(actor, number, note ?? "cancelled_by_staff");
  const o = await orderByNumber(number);
  if (o.status === status) return { order: await loadOrder(number) };
  if (!ORDER_TRANSITIONS[o.status].includes(status)) {
    throw new ApiError(422, "invalid_order_transition", `Cannot move an order from ${o.status} to ${status}`, { allowed: ORDER_TRANSITIONS[o.status] });
  }
  const updated = maybe(await (await userDb()).from("orders").update({ status }).eq("id", o.id).select("id").maybeSingle());
  if (!updated) throw new ApiError(403, "forbidden", "Missing permission: orders.write");
  if (note) {
    const last = maybe(await db().from("order_status_history").select("id").eq("order_id", o.id).eq("to_status", status)
      .order("created_at", { ascending: false }).limit(1).maybeSingle());
    if (last) exec(await db().from("order_status_history").update({ note, actor_type: "staff", actor_id: actor.userId }).eq("id", last.id));
  }
  await audit(actor, "order.status", "orders", o.id, { status: o.status }, { status, note: note ?? null });
  return { order: await loadOrder(number) };
}

/** cancel_order: releases holds, restocks committed stock, reverses redemptions. Refunds are a separate step. */
export async function cancelOrder(actor: Actor, number: string, reason: string) {
  const o = await orderByNumber(number);
  const result = must(await (await userDb()).rpc("cancel_order", { p_order_id: o.id, p_reason: reason }));
  await audit(actor, "order.cancel", "orders", o.id, { status: o.status }, { status: "cancelled", reason, result });
  return { result, order: await loadOrder(number) };
}

export async function addOrderNote(actor: Actor, number: string, body: string) {
  const o = await orderByNumber(number);
  await audit(actor, "order.note", "orders", o.id, null, { body });
  return { order: await loadOrder(number) };
}
