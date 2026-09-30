/** Inventory, orders, fulfilment, returns and payments inputs (client-safe). */
import { z } from "zod";
import { ORDER_STATUS, PAYMENT_PROVIDER, PAYMENT_STATUS, RETURN_STATUS, SHIPMENT_STATUS } from "@/types/domain";
import { optText } from "./catalog";

const page = { page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(25) };
export const PageQuery = z.object(page);

// ---------- Inventory ----------
export const InventoryListQuery = z.object({ q: z.string().max(100).optional(), filter: z.enum(["all", "low", "out"]).default("all"), ...page });
export const MovementsQuery = PageQuery;
export const AdjustSchema = z.object({
  variantId: z.uuid(),
  delta: z.number().int().min(-1_000_000).max(1_000_000).refine((d) => d !== 0, "Delta cannot be 0"),
  reason: z.enum(["restock", "adjustment", "damage", "correction", "initial", "return"]),
  note: optText(500),
  /** uuid; a retry with the same key is a no-op. */
  idempotencyKey: z.uuid().optional(),
});

// ---------- Orders ----------
export const OrderListQuery = z.object({
  q: z.string().max(100).optional(),
  status: z.enum(ORDER_STATUS).optional(),
  paymentStatus: z.enum(PAYMENT_STATUS).optional(),
  provider: z.enum(PAYMENT_PROVIDER).optional(),
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
  ...page,
});
export const OrderStatusSchema = z.object({ status: z.enum(ORDER_STATUS), note: optText(500) });
export const CancelSchema = z.object({ reason: z.string().trim().min(1).max(200).default("cancelled_by_staff") });
export const NoteSchema = z.object({ body: z.string().trim().min(1).max(2000) });
export const RefundSchema = z.object({
  amount: z.number().int().positive(),
  reason: z.string().trim().min(1).max(500),
  /** Defaults to the order's captured payment. */
  paymentId: z.uuid().optional(),
  /** Set to refund a duplicate / mismatched capture. */
  attemptId: z.uuid().optional(),
  returnRequestId: z.uuid().optional(),
  /** Client-generated; a retry with the same key returns the same refund. */
  idempotencyKey: z.string().min(8).max(200),
});
export const RefundUpdateSchema = z.object({
  status: z.enum(["processing", "processed", "failed"]),
  providerRefundId: z.string().max(100).nullable().optional(),
  failureReason: optText(500),
});
const shipmentFields = {
  provider: z.enum(["shiprocket", "manual"]).optional(),
  awb: z.string().trim().min(3).max(64).nullable().optional(),
  courierName: optText(80), courierCode: optText(40), trackingUrl: z.url().nullable().optional(),
  eta: z.iso.date().nullable().optional(), weightGrams: z.number().int().positive().nullable().optional(),
  labelUrl: z.url().nullable().optional(),
};
export const ShipmentCreateSchema = z.object({
  ...shipmentFields,
  /** Defaults to every item in full. */
  items: z.array(z.object({ orderItemId: z.uuid(), quantity: z.number().int().positive() })).optional(),
});
export const ShipmentUpdateSchema = z.object({
  id: z.uuid(), ...shipmentFields, status: z.enum(SHIPMENT_STATUS).optional(), note: optText(500), location: optText(120),
});

// ---------- Returns ----------
export const ReturnListQuery = z.object({ status: z.enum(RETURN_STATUS).optional(), q: z.string().max(50).optional(), ...page });
export const ReturnActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve"), refundAmount: z.number().int().min(0).optional() }),
  z.object({ action: z.literal("reject"), rejectionReason: z.string().trim().min(1).max(500) }),
  z.object({ action: z.literal("schedule_pickup"), pickupShipmentId: z.uuid().optional() }),
  z.object({
    action: z.literal("receive"),
    /** Per item condition; unused (or unset) items are restocked by the DB. */
    items: z.array(z.object({ id: z.uuid(), condition: z.enum(["unused", "used", "damaged", "missing"]) })).default([]),
  }),
  z.object({ action: z.literal("close") }),
]);

// ---------- Payments ----------
export const PaymentListQuery = z.object({
  kind: z.enum(["payments", "attempts", "events"]).default("payments"),
  provider: z.enum(PAYMENT_PROVIDER).optional(),
  status: z.string().max(40).optional(),
  failureStage: z.string().max(40).optional(),
  orderNumber: z.string().max(40).optional(),
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
  ...page,
});
export const ReconcileSchema = z.object({ orderNumber: z.string().min(1).max(40) });
export const GatewayPatchSchema = z.object({
  isEnabled: z.boolean().optional(),
  mode: z.enum(["test", "live"]).optional(),
  displayName: z.string().trim().min(1).max(60).optional(),
  description: optText(300),
  sortOrder: z.number().int().optional(),
  minAmount: z.number().int().min(0).nullable().optional(),
  maxAmount: z.number().int().min(0).nullable().optional(),
  /** Non-secret keys only (key_id, theme_color…). Secrets live in env. */
  config: z.record(z.string(), z.unknown()).optional(),
});
