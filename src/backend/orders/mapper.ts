/** Order rows / tracking json -> domain (pure). */
import { toOptions } from "@/backend/pricing/quote";
import type {
  Address, Order, OrderItem, OrderShipment, OrderStatus, OrderSummary, OrderTracking, PaymentProvider, PaymentStatus, TrackingEvent,
} from "@/types/domain";

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
const s = (v: unknown) => (typeof v === "string" && v ? v : undefined);

export const ORDER_COLS =
  "id, order_number, status, payment_status, payment_provider, email, phone, customer_name, shipping_address, shipping_method_name, " +
  "subtotal, discount_total, shipping_total, cod_fee, tax_total, total, coupon_code, tracking_token, placed_at, delivered_at, cancelled_at, " +
  "items:order_items!order_items_order_id_fkey(id, product_id, variant_id, sku, product_name, brand, variant_title, options, image_url, unit_price, compare_at_price, quantity, line_total, return_window_days), " +
  "shipments:shipments!shipments_order_id_fkey(courier_name, awb, status, eta, tracking_url, direction, created_at, events:shipment_events(occurred_at, status, location, note)), " +
  "history:order_status_history(to_status, created_at, note)";
export const ORDER_SUMMARY_COLS = "id, order_number, status, payment_status, total, placed_at, items:order_items!order_items_order_id_fkey(quantity, image_url, product_name)";

export interface ItemRow {
  id: string; product_id: string | null; variant_id: string | null; sku: string; product_name: string; brand: string | null;
  variant_title: string; options: unknown; image_url: string | null; unit_price: number; compare_at_price: number | null;
  quantity: number; line_total: number; return_window_days: number;
}
interface ShipmentRow {
  courier_name: string | null; awb: string | null; status: OrderShipment["status"]; eta: string | null; tracking_url: string | null;
  direction: string; created_at: string; events: { occurred_at: string; status: TrackingEvent["status"]; location: string | null; note: string | null }[] | null;
}
export interface OrderRow {
  id: string; order_number: string; status: OrderStatus; payment_status: PaymentStatus; payment_provider: PaymentProvider;
  email: string; phone: string; customer_name: string; shipping_address: unknown; shipping_method_name: string | null;
  subtotal: number; discount_total: number; shipping_total: number; cod_fee: number; tax_total: number; total: number;
  coupon_code: string | null; tracking_token: string; placed_at: string; delivered_at: string | null; cancelled_at: string | null;
  items: ItemRow[] | null; shipments: ShipmentRow[] | null; history: { to_status: OrderStatus; created_at: string; note: string | null }[] | null;
}
export interface OrderSummaryRow {
  id: string; order_number: string; status: OrderStatus; payment_status: PaymentStatus; total: number; placed_at: string;
  items: { quantity: number; image_url: string | null; product_name: string }[] | null;
}

/** Address jsonb (camelCase, as written by place_order) -> Address. */
export function toAddress(v: unknown): Address {
  const a = obj(v);
  return {
    id: s(a.id), label: s(a.label), name: String(a.name ?? ""), phone: String(a.phone ?? ""), line1: String(a.line1 ?? ""),
    line2: s(a.line2), landmark: s(a.landmark), city: String(a.city ?? ""), state: String(a.state ?? ""),
    postalCode: String(a.postalCode ?? a.postal_code ?? ""), country: String(a.country ?? "IN"),
  };
}

export const toOrderItem = (i: ItemRow): OrderItem => ({
  id: i.id, productId: i.product_id, variantId: i.variant_id, sku: i.sku, name: i.product_name, brand: i.brand ?? undefined,
  image: { url: i.image_url ?? "", alt: i.product_name }, variantTitle: i.variant_title, options: toOptions(i.options),
  unitPrice: i.unit_price, compareAt: i.compare_at_price ?? undefined, quantity: i.quantity, lineTotal: i.line_total,
  returnWindowDays: i.return_window_days,
});

const toEvents = (list: unknown): TrackingEvent[] =>
  (Array.isArray(list) ? list : []).map((e) => {
    const x = obj(e);
    return { at: String(x.at ?? x.occurred_at ?? ""), status: x.status as TrackingEvent["status"], location: s(x.location), note: s(x.note) };
  }).sort((a, b) => b.at.localeCompare(a.at));

export function toOrder(r: OrderRow): Order {
  const ship = [...(r.shipments ?? [])].filter((x) => x.direction === "forward").sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  return {
    id: r.id, number: r.order_number, status: r.status, paymentStatus: r.payment_status, paymentProvider: r.payment_provider,
    email: r.email, phone: r.phone, customerName: r.customer_name, shippingAddress: toAddress(r.shipping_address),
    shippingMethodName: r.shipping_method_name ?? undefined,
    items: (r.items ?? []).map(toOrderItem),
    totals: {
      subtotal: r.subtotal, discount: r.discount_total, shipping: r.shipping_total, codFee: r.cod_fee, tax: r.tax_total, total: r.total,
      appliedCoupon: r.coupon_code ?? undefined,
    },
    placedAt: r.placed_at, deliveredAt: r.delivered_at ?? undefined, cancelledAt: r.cancelled_at ?? undefined,
    trackingToken: r.tracking_token,
    shipment: ship ? {
      carrier: ship.courier_name ?? "", awb: ship.awb ?? "", status: ship.status, eta: ship.eta ?? undefined,
      trackingUrl: ship.tracking_url ?? undefined, events: toEvents(ship.events),
    } : undefined,
    history: [...(r.history ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((h) => ({ status: h.to_status, at: h.created_at, note: h.note ?? undefined })),
  };
}

export const toOrderSummary = (r: OrderSummaryRow): OrderSummary => {
  const first = (r.items ?? []).find((i) => i.image_url);
  return {
    id: r.id, number: r.order_number, status: r.status, paymentStatus: r.payment_status, total: r.total, placedAt: r.placed_at,
    itemCount: (r.items ?? []).reduce((n, i) => n + i.quantity, 0),
    image: first ? { url: first.image_url!, alt: first.product_name } : undefined,
  };
};

/** get_order_tracking jsonb -> OrderTracking (null when the token is unknown). */
export function toTracking(raw: unknown): OrderTracking | null {
  if (!raw || typeof raw !== "object") return null;
  const t = obj(raw);
  const to = obj(t.shipTo);
  const sh = t.shipment ? obj(t.shipment) : null;
  return {
    number: String(t.number), status: t.status as OrderStatus, paymentStatus: t.paymentStatus as PaymentStatus,
    placedAt: String(t.placedAt ?? ""), deliveredAt: s(t.deliveredAt),
    shipTo: { name: String(to.name ?? ""), city: String(to.city ?? ""), state: String(to.state ?? ""), postalCode: String(to.postalCode ?? "") },
    items: (Array.isArray(t.items) ? t.items : []).map((i) => {
      const x = obj(i);
      const url = s(x.image);
      return {
        name: String(x.name ?? ""), variantTitle: String(x.variantTitle ?? ""), options: toOptions(x.options),
        quantity: Number(x.quantity ?? 0), image: url ? { url, alt: String(x.name ?? "") } : undefined,
      };
    }),
    shipment: sh ? {
      carrier: String(sh.carrier ?? ""), awb: String(sh.awb ?? ""), status: sh.status as OrderShipment["status"],
      eta: s(sh.eta), trackingUrl: s(sh.trackingUrl), events: toEvents(sh.events),
    } : undefined,
    history: (Array.isArray(t.history) ? t.history : []).map((h) => ({ status: obj(h).status as OrderStatus, at: String(obj(h).at ?? "") })),
  };
}
