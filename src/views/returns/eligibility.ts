import { RETURN_WINDOW_DAYS } from "@/data/account";
import type { AccountOrder, ReturnRequest } from "@/data/orders";

const DAY = 86_400_000;

/** When the order was delivered (last carrier "delivered" event), if it was. */
export const deliveredAt = (o: AccountOrder) => o.shipment?.events.findLast((e) => e.status === "delivered")?.at;

/** Items still returnable: delivered, inside the window, not already in a return. */
export function returnableItems(order: AccountOrder, existing: ReturnRequest[], now = Date.now()) {
  const at = deliveredAt(order);
  if (order.status !== "delivered" || !at || now - new Date(at).getTime() > RETURN_WINDOW_DAYS * DAY) return [];
  const taken = new Set(existing.filter((r) => r.orderNumber === order.number).map((r) => r.itemId));
  return order.items.filter((i) => !taken.has(i.id));
}
