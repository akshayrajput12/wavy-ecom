import "server-only";
import { cache } from "react";
import { getSession, type Session } from "@/backend/_core/auth";
import { must, publicDb, safe, serviceDb, userDb } from "@/backend/_core/db";
import { ApiError } from "@/backend/_core/http";
import { hasServiceRole } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { Order, OrderStatus, OrderSummary, OrderTracking } from "@/types/domain";
import { ORDER_COLS, ORDER_SUMMARY_COLS, toOrder, toOrderSummary, toTracking, type OrderRow, type OrderSummaryRow } from "./mapper";

/** Statuses a customer may cancel from (before the parcel is packed). */
export const CUSTOMER_CANCELLABLE: readonly OrderStatus[] = ["pending_payment", "paid", "processing"];

/** Signed-in customer's orders, newest first (RLS own_select). */
export async function listMyOrders(session: Session): Promise<OrderSummary[]> {
  const db = await userDb();
  const rows: OrderSummaryRow[] = must(
    await db.from("orders").select(ORDER_SUMMARY_COLS).eq("user_id", session.userId).order("placed_at", { ascending: false }).limit(100),
    "list your orders",
  ) ?? [];
  return rows.map(toOrderSummary);
}

/** One of the signed-in customer's orders by number (null when not theirs / unknown). */
export async function getMyOrder(session: Session, number: string): Promise<Order | null> {
  const db = await userDb();
  const row: OrderRow | null = must(
    await db.from("orders").select(ORDER_COLS).eq("order_number", number).eq("user_id", session.userId).maybeSingle(), "load your order",
  );
  return row ? toOrder(row) : null;
}

/**
 * Order confirmation / payment-retry page: the owner (session) or a guest holding the order's tracking token.
 * Service-role read, so the credential check here is the gate.
 */
export async function getOrderForViewer(number: string, trackingToken?: string): Promise<Order | null> {
  if (!hasServiceRole) return null;
  const [session, row] = await Promise.all([getSession(), orderRowByNumber(number)]);
  if (!row) return null;
  const allowed = (session && row.user_id === session.userId) || (trackingToken && trackingToken === row.tracking_token);
  return allowed ? toOrder(row) : null;
}

/**
 * Unchecked service-role read of an order by number, deduped per request (React cache): the success page's order,
 * guest invoice offer and its gate share one round trip. Callers MUST check the viewer (session owner / tracking token).
 */
export const orderRowByNumber = cache(async (number: string): Promise<(OrderRow & { user_id: string | null }) | null> =>
  safe(await serviceDb().from("orders").select(`${ORDER_COLS}, user_id`).eq("order_number", number).maybeSingle(), "load order", null));

/** Public tracking by token (safe fields only). */
export async function getOrderTracking(token: string): Promise<OrderTracking | null> {
  const db = publicDb();
  if (!db || token.length < 32) return null;
  return toTracking(safe(await db.rpc("get_order_tracking", { p_token: token }), "track order", null));
}

/** Customer cancel. Ownership via RLS read, then cancel_order (service role) releases/restocks and reverses discounts. */
export async function cancelMyOrder(session: Session, number: string, reason?: string) {
  const db = await userDb();
  const row = must<{ id: string; status: OrderStatus } | null>(
    await db.from("orders").select("id, status").eq("order_number", number).eq("user_id", session.userId).maybeSingle(), "load your order",
  );
  if (!row) throw new ApiError(404, "order_not_found", "Order not found");
  if (!CUSTOMER_CANCELLABLE.includes(row.status)) throw new ApiError(409, "order_not_cancellable", "This order can no longer be cancelled");
  const res = must<{ status: OrderStatus; refundRequired: boolean; refundableAmount: number }>(
    await serviceDb().rpc("cancel_order", { p_order_id: row.id, p_reason: `customer: ${reason?.slice(0, 200) || "cancelled"}` }),
    "cancel the order",
  );
  const log = logger.child({ svc: "orders", orderId: row.id, userId: session.userId });
  log.info("order.cancelled_by_customer", { from: row.status });
  // ponytail: refunds are issued by staff from the admin console (refunds table); flagged here for the queue
  if (res.refundRequired) log.warn("order.refund_required", { amount: res.refundableAmount });
  return { status: res.status, refundRequired: res.refundRequired, refundableAmount: res.refundableAmount };
}
