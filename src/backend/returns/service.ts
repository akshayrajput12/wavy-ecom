import "server-only";
import type { Session } from "@/backend/_core/auth";
import { dbError, must, serviceDb, userDb } from "@/backend/_core/db";
import { ApiError } from "@/backend/_core/http";
import { logger } from "@/lib/logger";
import type { ReturnRequest } from "@/types/domain";
import type { CreateReturnInput } from "./schema";

const COLS = "id, rma_number, order_id, status, reason, customer_note, refund_amount, created_at";
interface Row {
  id: string; rma_number: string; order_id: string; status: ReturnRequest["status"]; reason: ReturnRequest["reason"];
  customer_note: string | null; refund_amount: number | null; created_at: string;
}
const toReturn = (r: Row): ReturnRequest => ({
  id: r.id, rmaNumber: r.rma_number, orderId: r.order_id, status: r.status, reason: r.reason,
  customerNote: r.customer_note ?? undefined, refundAmount: r.refund_amount ?? undefined, createdAt: r.created_at,
});

export async function listMyReturns(session: Session): Promise<ReturnRequest[]> {
  const db = await userDb();
  const rows: Row[] = must(await db.from("return_requests").select(COLS).eq("user_id", session.userId).order("created_at", { ascending: false }), "list your returns") ?? [];
  return rows.map(toReturn);
}

/**
 * Customer return request. Inserted with the user's client so the DB guards apply (own delivered order,
 * per-item return window, quantity <= bought). Evidence uploads go to the return-evidence bucket separately.
 */
export async function createReturnRequest(session: Session, input: CreateReturnInput): Promise<ReturnRequest> {
  const db = await userDb();
  const order = must<{ id: string } | null>(
    await db.from("orders").select("id").eq("order_number", input.orderNumber).eq("user_id", session.userId).maybeSingle(), "load your order",
  );
  if (!order) throw new ApiError(404, "order_not_found", "Order not found");

  const req = must<Row>(
    await db.from("return_requests").insert({
      order_id: order.id, user_id: session.userId, reason: input.reason, resolution: input.resolution, customer_note: input.customerNote ?? null,
    }).select(COLS).single(),
    "create the return",
  );
  const items = await db.from("return_items").insert(
    input.items.map((i) => ({ return_request_id: req.id, order_item_id: i.orderItemId, quantity: i.quantity, reason: i.reason ?? input.reason })),
  );
  if (items.error) {
    // no customer delete policy: roll the header back with the service role so no empty request lingers
    const admin = serviceDb();
    await admin.from("return_requests").delete().eq("id", req.id);
    const { count } = await admin.from("return_requests").select("id", { count: "exact", head: true }).eq("order_id", order.id).not("status", "in", "(rejected,closed)");
    if (!count) await admin.from("orders").update({ status: "delivered" }).eq("id", order.id).eq("status", "return_requested");
    throw dbError(items.error, "add the return items");
  }
  logger.child({ svc: "returns", userId: session.userId, orderId: order.id }).info("return.requested", { returnId: req.id, items: input.items.length });
  return toReturn(req);
}
