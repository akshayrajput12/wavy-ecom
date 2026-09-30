import "server-only";
import type { Session } from "@/backend/_core/auth";
import { must, serviceDb } from "@/backend/_core/db";
import { ApiError } from "@/backend/_core/http";
import { createAddress } from "@/backend/account/repo";
import { startRazorpayPayment, type ClientContext, type PaymentInstructions } from "@/backend/payments/service";
import { logger } from "@/lib/logger";
import type { OrderStatus, PaymentProvider, PaymentStatus } from "@/types/domain";
import type { CheckoutInput } from "./schema";

export interface PlacedOrder {
  id: string; number: string; status: OrderStatus; paymentStatus: PaymentStatus; paymentProvider: PaymentProvider;
  total: number; trackingToken: string; replayed: boolean;
}
export interface CheckoutResult { order: PlacedOrder; payment: PaymentInstructions }

const addr = (a: CheckoutInput["shippingAddress"]) => ({
  name: a.name, phone: a.phone, line1: a.line1, line2: a.line2, landmark: a.landmark,
  city: a.city, state: a.state, postalCode: a.postalCode, country: a.country,
});

/**
 * Idempotent order placement (place_order: same key -> same order, `replayed: true`). The server prices, reserves
 * stock and creates the payment row; online orders then get a fresh gateway attempt. COD/zero-total are confirmed now.
 */
export async function placeOrder(input: CheckoutInput, idempotencyKey: string, session: Session | null, ctx: ClientContext): Promise<CheckoutResult> {
  // ponytail: PayU adapter not built; the gateway row can stay disabled until it is
  if (input.paymentProvider === "payu") throw new ApiError(422, "gateway_unavailable", "This payment method is not available");
  const log = logger.child({ svc: "checkout", userId: session?.userId });
  const raw = must<{
    orderId: string; orderNumber: string; status: OrderStatus; paymentStatus: PaymentStatus; paymentProvider: PaymentProvider;
    total: number; trackingToken: string; replayed: boolean;
  }>(
    await serviceDb().rpc("place_order", {
      p_idempotency_key: idempotencyKey,
      p_payload: {
        userId: session?.userId ?? null, email: input.email, phone: input.phone,
        customerName: input.customerName || input.shippingAddress.name,
        shippingAddress: addr(input.shippingAddress), billingAddress: input.billingAddress ? addr(input.billingAddress) : null,
        items: input.items, couponCode: input.couponCode ?? null, shippingMethodId: input.shippingMethodId ?? null,
        paymentProvider: input.paymentProvider, notes: input.notes ?? null,
        customerIp: ctx.ip ?? null, userAgent: ctx.userAgent ?? null,
      },
    }),
    "place the order",
  );
  const order: PlacedOrder = {
    id: raw.orderId, number: raw.orderNumber, status: raw.status, paymentStatus: raw.paymentStatus,
    paymentProvider: raw.paymentProvider, total: raw.total, trackingToken: raw.trackingToken, replayed: raw.replayed,
  };
  log.info(order.replayed ? "order.replayed" : "order.placed", { orderId: order.id, provider: order.paymentProvider, total: order.total });

  if (session && input.saveAddress && !order.replayed) {
    await createAddress(session, { ...input.shippingAddress, isDefault: false })
      .catch((e: unknown) => log.warn("checkout.save_address_failed", { reason: e instanceof Error ? e.message : String(e) }));
  }

  if (order.status !== "pending_payment" || order.paymentProvider === "cod") {
    return { order, payment: { provider: "none", orderId: order.id, orderNumber: order.number } };
  }
  try {
    const payment = await startRazorpayPayment(
      { id: order.id, number: order.number, email: input.email, phone: input.phone, customerName: input.customerName || input.shippingAddress.name },
      ctx,
    );
    return { order, payment };
  } catch (e) {
    // the order exists (stock held until the TTL): hand back what the client needs to retry payment
    if (e instanceof ApiError) throw new ApiError(e.status, e.code, e.message, { order });
    throw e;
  }
}
