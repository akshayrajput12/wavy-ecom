import type { Order, OrderItem } from "@/types/domain";

const DAY = 86_400_000;

/** When the order was delivered: order.deliveredAt, else the last carrier "delivered" event. */
export const deliveredAt = (o: Pick<Order, "deliveredAt" | "shipment">) =>
  o.deliveredAt ?? o.shipment?.events.findLast((e) => e.status === "delivered")?.at;

/** Last day an item can be returned, or undefined when it can't be (0-day window / not delivered). */
export function returnDeadline(o: Pick<Order, "deliveredAt" | "shipment">, item: Pick<OrderItem, "returnWindowDays">) {
  const at = deliveredAt(o);
  return at && item.returnWindowDays > 0 ? new Date(new Date(at).getTime() + item.returnWindowDays * DAY) : undefined;
}

/**
 * Items the UI offers for return: delivered order, item window still open. Display gate only:
 * the DB re-checks ownership, window and quantity already returned (return_quantity_exceeds_purchase).
 */
export function returnableItems(order: Pick<Order, "status" | "items" | "deliveredAt" | "shipment">, now = Date.now()): OrderItem[] {
  if (order.status !== "delivered") return [];
  return order.items.filter((i) => {
    const end = returnDeadline(order, i);
    return !!end && now <= end.getTime();
  });
}
