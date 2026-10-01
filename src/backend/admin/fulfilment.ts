import "server-only";
import type { z } from "zod";
import { ApiError } from "@/backend/_core/http";
import { issueInvoiceIfEligible } from "@/backend/invoices/service";
import type { AdminReturn, Paginated } from "@/types/admin";
import type { Enum } from "@/types/admin";
import type { OrderStatus } from "@/types/domain";
import { type Actor, audit, camel, db, exec, maybe, must, notFound, pageRange, read, searchTerm, snake, userDb } from "./_shared";
import { loadOrder, orderByNumber } from "./orders";
import type { RefundSchema, RefundUpdateSchema, ReturnActionSchema, ReturnListQuery, ShipmentCreateSchema, ShipmentUpdateSchema } from "./schemas/ops";
import { ORDER_TRANSITIONS } from "./schemas/rules";

// ---------- Refunds ----------
/**
 * Records a `pending` refund (DB guard: total ≤ captured). Idempotent on idempotencyKey.
 * ponytail: gateway submission is not wired here; the payments worker (or staff via PATCH /refunds/:id for COD /
 * manual bank transfers) moves it to processed, which updates payment + order status in the DB.
 */
export async function createRefund(actor: Actor, number: string, input: z.infer<typeof RefundSchema>) {
  const c = db();
  const o = await orderByNumber(number);
  const prior = maybe(await c.from("refunds").select("*").eq("idempotency_key", input.idempotencyKey).maybeSingle());
  if (prior) {
    if (prior.order_id !== o.id) throw new ApiError(409, "idempotency_conflict", "Idempotency key used for another order");
    return { refund: camel(prior), replayed: true };
  }
  const payments = must(await c.from("payments").select("*").eq("order_id", o.id));
  const payment = input.paymentId ? payments.find((p) => p.id === input.paymentId) : payments.find((p) => p.amount_captured > 0);
  if (!payment) throw new ApiError(422, "no_captured_payment", "This order has no captured payment to refund");
  if (!input.attemptId) {
    const used = must(await c.from("refunds").select("amount, status, attempt_id").eq("payment_id", payment.id))
      .filter((r) => r.status !== "failed" && !r.attempt_id).reduce((s, r) => s + r.amount, 0);
    const refundable = payment.amount_captured - used;
    if (input.amount > refundable) throw new ApiError(422, "refund_exceeds_refundable", `At most ${refundable} paise can be refunded`, { refundable });
  }
  const row = must(await c.from("refunds").insert({
    payment_id: payment.id, order_id: o.id, attempt_id: input.attemptId ?? null, return_request_id: input.returnRequestId ?? null,
    amount: input.amount, reason: input.reason, status: "pending", idempotency_key: input.idempotencyKey, initiated_by: actor.userId,
  }).select("*").single());
  await audit(actor, "refund.create", "refunds", row.id, null, row);
  return { refund: camel(row), replayed: false };
}

export async function updateRefund(actor: Actor, id: string, input: z.infer<typeof RefundUpdateSchema>) {
  const c = db();
  const before = maybe(await c.from("refunds").select("*").eq("id", id).maybeSingle());
  if (!before) notFound("Refund");
  const row = must(await c.from("refunds").update({
    status: input.status, provider_refund_id: input.providerRefundId ?? before.provider_refund_id,
    failure_reason: input.status === "failed" ? input.failureReason ?? "failed" : before.failure_reason,
  }).eq("id", id).select("*").single());
  await audit(actor, "refund.update", "refunds", id, before, row);
  return camel(row);
}

// ---------- Shipments ----------
const SHIP_TO_ORDER: Partial<Record<Enum<"shipment_status">, OrderStatus>> = {
  picked_up: "shipped", in_transit: "shipped", out_for_delivery: "shipped", delivered: "delivered",
};

/** Walks the order forward (processing → shipped → delivered) as far as the state machine allows. */
async function followShipment(orderId: string, current: OrderStatus, target: OrderStatus) {
  const steps: OrderStatus[] = target === "delivered" && current !== "shipped" ? ["shipped", "delivered"] : [target];
  const session = await userDb();
  let at = current;
  for (const s of steps) {
    if (!ORDER_TRANSITIONS[at].includes(s)) continue;
    exec(await session.from("orders").update({ status: s }).eq("id", orderId));
    at = s;
  }
  if (at !== current) await issueInvoiceIfEligible(orderId, "shipment"); // COD: dispatch issues the invoice
}

export async function createShipment(actor: Actor, number: string, input: z.infer<typeof ShipmentCreateSchema>) {
  const c = db();
  const o = await orderByNumber(number);
  const orderItems = must(await c.from("order_items").select("id, quantity").eq("order_id", o.id));
  const items = input.items ?? orderItems.map((i) => ({ orderItemId: i.id, quantity: i.quantity }));
  const valid = new Map(orderItems.map((i) => [i.id, i.quantity]));
  if (items.some((i) => (valid.get(i.orderItemId) ?? 0) < i.quantity)) throw new ApiError(422, "invalid_shipment_items", "Items must belong to the order");
  const { items: _items, ...fields } = input;
  const ship = must(await c.from("shipments").insert({ ...snake(fields), order_id: o.id, direction: "forward", provider: input.provider ?? "manual" }).select("*").single());
  exec(await c.from("shipment_items").insert(items.map((i) => ({ shipment_id: ship.id, order_item_id: i.orderItemId, quantity: i.quantity }))));
  exec(await c.from("shipment_events").insert({ shipment_id: ship.id, status: "created", occurred_at: new Date().toISOString(), note: "created by staff" }));
  await audit(actor, "shipment.create", "shipments", ship.id, null, { ...ship, items });
  return { order: await loadOrder(number) };
}

export async function updateShipment(actor: Actor, number: string, input: z.infer<typeof ShipmentUpdateSchema>) {
  const c = db();
  const o = await orderByNumber(number);
  const before = maybe(await c.from("shipments").select("*").eq("id", input.id).eq("order_id", o.id).maybeSingle());
  if (!before) notFound("Shipment");
  const { id, note, location, ...fields } = input;
  const now = new Date().toISOString();
  const changed = input.status && input.status !== before.status;
  const row = must(await c.from("shipments").update({
    ...snake(fields),
    ...(changed && input.status === "delivered" ? { delivered_at: now } : {}),
    ...(changed && SHIP_TO_ORDER[input.status!] === "shipped" && !before.shipped_at ? { shipped_at: now } : {}),
  }).eq("id", id).select("*").single());
  if (changed) {
    exec(await c.from("shipment_events").insert({ shipment_id: id, status: input.status!, occurred_at: now, note: note ?? "updated by staff", location: location ?? null }));
    const target = SHIP_TO_ORDER[input.status!];
    if (target && before.direction === "forward") await followShipment(o.id, o.status, target);
  }
  await audit(actor, "shipment.update", "shipments", id, before, row);
  return { order: await loadOrder(number) };
}

// ---------- Returns ----------
const RETURN_NEXT: Record<Enum<"return_status">, Enum<"return_status">[]> = {
  requested: ["approved", "rejected"], approved: ["pickup_scheduled", "received", "closed"], rejected: ["closed"],
  pickup_scheduled: ["received", "closed"], received: ["closed"], refunded: ["closed"], closed: [],
};

export const listReturns = (q: z.infer<typeof ReturnListQuery>) =>
  read("returns.read", { items: [], total: 0, page: q.page, pageSize: q.pageSize } as Paginated<AdminReturn>, async () => {
    const c = db();
    const [from, to] = pageRange(q.page, q.pageSize);
    let b = c.from("return_requests").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (q.status) b = b.eq("status", q.status);
    const term = searchTerm(q.q);
    if (term) b = b.ilike("rma_number", `%${term}%`);
    const res = await b.range(from, to);
    const rows = must(res);
    const [items, orders] = rows.length
      ? await Promise.all([
          c.from("return_items").select("*").in("return_request_id", rows.map((r) => r.id)).then(must),
          c.from("orders").select("id, order_number").in("id", rows.map((r) => r.order_id)).then(must),
        ])
      : [[], []];
    const num = new Map(orders.map((o) => [o.id, o.order_number]));
    return {
      items: rows.map((r) => ({ ...camel(r), orderNumber: num.get(r.order_id), items: items.filter((i) => i.return_request_id === r.id).map(camel) })),
      total: res.count ?? 0, page: q.page, pageSize: q.pageSize,
    };
  });

/** Approve / reject / schedule pickup / receive (DB restocks unused items, order → returned) / close. */
export async function actOnReturn(actor: Actor, id: string, input: z.infer<typeof ReturnActionSchema>) {
  const c = db();
  const before = maybe(await c.from("return_requests").select("*").eq("id", id).maybeSingle());
  if (!before) notFound("Return");
  const to = ({ approve: "approved", reject: "rejected", schedule_pickup: "pickup_scheduled", receive: "received", close: "closed" } as const)[input.action];
  if (!RETURN_NEXT[before.status].includes(to)) throw new ApiError(422, "invalid_return_transition", `Cannot move a return from ${before.status} to ${to}`);
  if (input.action === "receive") {
    for (const i of input.items) exec(await c.from("return_items").update({ condition: i.condition }).eq("id", i.id).eq("return_request_id", id));
  }
  const row = must(await c.from("return_requests").update({
    status: to,
    ...(input.action === "approve" ? { refund_amount: input.refundAmount ?? before.refund_amount, reviewed_by: actor.userId } : {}),
    ...(input.action === "reject" ? { rejection_reason: input.rejectionReason, reviewed_by: actor.userId } : {}),
    ...(input.action === "schedule_pickup" && input.pickupShipmentId ? { pickup_shipment_id: input.pickupShipmentId } : {}),
  }).eq("id", id).select("*").single());
  await audit(actor, `return.${input.action}`, "return_requests", id, before, row);
  return camel(row);
}
