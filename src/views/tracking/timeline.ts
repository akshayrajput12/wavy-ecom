import type { Order, OrderStatus, ShipmentStatus } from "@/types/domain";

export const DELIVERY_STEPS = ["placed", "packed", "shipped", "out_for_delivery", "delivered"] as const;
export type DeliveryStep = { key: (typeof DELIVERY_STEPS)[number]; done: boolean; current: boolean; at?: string };
export type TimelineSource = Pick<Order, "status" | "placedAt" | "deliveredAt" | "shipment"> & { history?: { status: OrderStatus; at: string }[] };

const DELIVERED_OR_AFTER: OrderStatus[] = ["delivered", "return_requested", "returned"];

/** Order + shipment state -> the 5-step customer journey (placed, packed, shipped, out for delivery, delivered). */
export function deliverySteps(o: TimelineSource): DeliveryStep[] {
  const ship = o.shipment?.status;
  const hist = (s: OrderStatus) => o.history?.findLast((h) => h.status === s)?.at;
  const ev = (...s: ShipmentStatus[]) => o.shipment?.events.find((e) => s.includes(e.status))?.at;
  const deliveredAt = o.deliveredAt ?? hist("delivered") ?? ev("delivered");

  const reached =
    o.status === "cancelled" ? 0
      : DELIVERED_OR_AFTER.includes(o.status) || ship === "delivered" || (o.status === "refunded" && !!deliveredAt) ? 4
      : ship === "out_for_delivery" ? 3
      : o.status === "shipped" || ship === "picked_up" || ship === "in_transit" ? 2
      : o.status === "packed" || ship === "created" ? 1
      : 0;

  const at = [o.placedAt, hist("packed") ?? ev("created"), hist("shipped") ?? ev("picked_up", "in_transit"), ev("out_for_delivery"), deliveredAt];
  return DELIVERY_STEPS.map((key, i) => ({ key, done: i <= reached, current: i === reached, at: i <= reached ? at[i] : undefined }));
}
