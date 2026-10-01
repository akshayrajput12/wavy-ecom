import "server-only";
import { must, serviceDb } from "@/backend/_core/db";
import { ApiError } from "@/backend/_core/http";
import { issueInvoiceIfEligible } from "@/backend/invoices/service";
import { getStoreSettings } from "@/backend/settings/repo";
import { logger } from "@/lib/logger";
import type { Json } from "@/types/database";
import { toFailureStage, toPaymentMethod, verifyPaymentSignature } from "./providers/razorpay-crypto";
import {
  captureRazorpayPayment, createRazorpayOrder, fetchRazorpayPayment, razorpayConfig, toInfo, type RazorpayPaymentInfo,
} from "./providers/razorpay";
import type { FailureInput, VerifyInput } from "./schema";

const log = logger.child({ svc: "payments" });

/** What the client does next. `none` = nothing to pay online (COD, zero total, already paid). */
export type PaymentInstructions =
  | { provider: "none"; orderId: string; orderNumber: string }
  | {
      provider: "razorpay"; orderId: string; orderNumber: string; attemptId: string;
      keyId: string; razorpayOrderId: string; amount: number; currency: string; name: string;
      prefill: { name: string; email: string; contact: string };
    };

export interface PayableOrder { id: string; number: string; email: string; phone: string; customerName: string }
export interface ClientContext { ip?: string; userAgent?: string }

export interface CaptureResult { result: string; refundRequired: boolean; orderId: string; orderNumber?: string }

/** New attempt + Razorpay order for a pending_payment order. Safe to call again (each call = one attempt). */
export async function startRazorpayPayment(order: PayableOrder, ctx: ClientContext): Promise<PaymentInstructions> {
  const { keyId } = razorpayConfig();
  const db = serviceDb();
  const attempt = must<{ attemptId: string; paymentId: string; amount: number; currency: string }>(
    await db.rpc("start_payment_attempt", {
      p_order_id: order.id, p_provider: "razorpay", p_client_ip: ctx.ip ?? null, p_user_agent: ctx.userAgent ?? null,
    }),
    "start the payment",
  );
  const alog = log.child({ orderId: order.id, attemptId: attempt.attemptId });
  let rzp: { id: string; amount: number; currency: string };
  try {
    rzp = await createRazorpayOrder({
      amount: attempt.amount, currency: attempt.currency, receipt: order.number,
      notes: { orderId: order.id, orderNumber: order.number, attemptId: attempt.attemptId },
    });
  } catch (e) {
    alog.error("payment.gateway_order_failed", e);
    await db.rpc("record_payment_failure", {
      p_attempt_id: attempt.attemptId, p_stage: "order_creation", p_code: "razorpay_order_create_failed",
      p_reason: e instanceof Error ? e.message.slice(0, 500) : "order create failed", p_source: "internal",
    });
    throw new ApiError(502, "gateway_error", "The payment gateway is unavailable. Please try again.");
  }
  await Promise.all([
    db.from("payment_attempts").update({ provider_order_id: rzp.id, raw_request: { razorpayOrderId: rzp.id } }).eq("id", attempt.attemptId),
    db.from("payments").update({ provider_order_id: rzp.id }).eq("id", attempt.paymentId),
  ]);
  alog.info("payment.initiated", { provider: "razorpay", amount: rzp.amount });
  const settings = await getStoreSettings();
  return {
    provider: "razorpay", orderId: order.id, orderNumber: order.number, attemptId: attempt.attemptId,
    keyId, razorpayOrderId: rzp.id, amount: rzp.amount, currency: rzp.currency, name: settings?.storeName ?? "",
    prefill: { name: order.customerName, email: order.email, contact: order.phone },
  };
}

/** Retry for an unpaid order. Credential: the order's tracking token (guest) or owning session user. */
export async function retryPayment(orderId: string, auth: { trackingToken?: string; userId?: string }, ctx: ClientContext) {
  const db = serviceDb();
  const o = must<{ id: string; order_number: string; email: string; phone: string; customer_name: string; status: string; user_id: string | null; tracking_token: string } | null>(
    await db.from("orders").select("id, order_number, email, phone, customer_name, status, user_id, tracking_token").eq("id", orderId).maybeSingle(),
    "load the order",
  );
  const allowed = o && ((auth.trackingToken && auth.trackingToken === o.tracking_token) || (auth.userId && auth.userId === o.user_id));
  if (!o || !allowed) throw new ApiError(404, "order_not_found", "Order not found");
  if (o.status !== "pending_payment") throw new ApiError(409, "order_not_payable", "This order no longer needs payment");
  return startRazorpayPayment({ id: o.id, number: o.order_number, email: o.email, phone: o.phone, customerName: o.customer_name }, ctx);
}

async function markCaptured(orderId: string, attemptId: string, p: RazorpayPaymentInfo, source: string): Promise<CaptureResult> {
  const raw = p.raw as Json;
  const details = { vpa: p.raw.vpa ?? null, bank: p.raw.bank ?? null, wallet: p.raw.wallet ?? null } as Json;
  const res = must<CaptureResult>(await serviceDb().rpc("mark_payment_captured", {
    p_order_id: orderId, p_attempt_id: attemptId, p_provider_payment_id: p.id, p_amount: p.amount,
    p_method: toPaymentMethod(p.method), p_raw: raw, p_method_details: details,
  }), "record the payment");
  const clog = log.child({ orderId, attemptId, source });
  if (res.refundRequired) clog.warn("payment.refund_required", { result: res.result, paymentId: p.id });
  else clog.info("payment.captured", { result: res.result, amount: p.amount });
  // GST invoice at capture; idempotent, so webhook + callback racing each other still yield one invoice
  if (res.result === "captured" || res.result === "already_captured") await issueInvoiceIfEligible(orderId, source, clog);
  return res;
}

async function recordFailure(attemptId: string, p: Partial<RazorpayPaymentInfo>, source: string, stage = toFailureStage(p.errorReason, p.errorCode)) {
  const res = must<{ result: string }>(await serviceDb().rpc("record_payment_failure", {
    p_attempt_id: attemptId, p_stage: stage, p_code: p.errorCode ?? null, p_reason: p.errorDescription ?? p.errorReason ?? null,
    p_source: source, p_raw: (p.raw ?? null) as Json, p_provider_payment_id: p.id ?? null,
  }), "record the payment failure");
  log.child({ attemptId, source }).warn("payment.failed", { stage, code: p.errorCode, result: res.result });
  return res;
}

/** Look up a razorpay attempt by the gateway order id (webhooks) or check it belongs to the order (callback). */
async function findAttempt(filter: { attemptId?: string; orderId?: string; razorpayOrderId?: string }) {
  let b = serviceDb().from("payment_attempts").select("id, order_id, provider_order_id").eq("provider", "razorpay");
  if (filter.attemptId) b = b.eq("id", filter.attemptId);
  if (filter.orderId) b = b.eq("order_id", filter.orderId);
  if (filter.razorpayOrderId) b = b.eq("provider_order_id", filter.razorpayOrderId);
  const rows = must<{ id: string; order_id: string; provider_order_id: string | null }[]>(
    await b.order("attempt_no", { ascending: false }).limit(1), "load the payment attempt",
  );
  return rows[0] ?? null;
}

/** Checkout callback: verify signature, confirm with Razorpay (never trust the client amount), capture idempotently. */
export async function verifyRazorpayPayment(input: VerifyInput): Promise<CaptureResult | { result: "failed"; orderId: string }> {
  const { keySecret } = razorpayConfig();
  const attempt = await findAttempt({ attemptId: input.attemptId, orderId: input.orderId });
  if (!attempt || attempt.provider_order_id !== input.razorpayOrderId) throw new ApiError(400, "attempt_mismatch", "Payment does not match this order");
  if (!verifyPaymentSignature(input.razorpayOrderId, input.razorpayPaymentId, input.razorpaySignature, keySecret)) {
    await recordFailure(attempt.id, { id: input.razorpayPaymentId, errorCode: "invalid_signature", errorDescription: "checkout signature mismatch" }, "client", "signature_mismatch");
    throw new ApiError(400, "signature_invalid", "We could not verify this payment");
  }
  let p = await fetchRazorpayPayment(input.razorpayPaymentId);
  if (p.orderId !== input.razorpayOrderId) throw new ApiError(400, "attempt_mismatch", "Payment does not match this order");
  if (p.status === "authorized") p = await captureRazorpayPayment(p.id, p.amount, p.currency);
  if (p.status === "failed") { await recordFailure(attempt.id, p, "client"); return { result: "failed", orderId: input.orderId }; }
  if (p.status !== "captured") throw new ApiError(409, "payment_pending", "Payment is still processing; we will confirm it shortly");
  return markCaptured(input.orderId, attempt.id, p, "callback");
}

/** Client-reported failure/cancel from the checkout modal (idempotent; late success still wins via webhook). */
export async function reportPaymentFailure(input: FailureInput) {
  const stage = input.stage ?? toFailureStage(input.reason, input.code);
  return recordFailure(input.attemptId, {
    id: input.razorpayPaymentId, errorCode: input.code, errorDescription: input.description, errorReason: input.reason,
  }, "client", stage);
}

/**
 * Webhook body already verified. Returns what happened; throws on processing errors so Razorpay retries
 * (a retried event whose row is not `processed/ignored` is processed again).
 */
export async function processRazorpayEvent(event: string, payload: Record<string, unknown>): Promise<{ status: "processed" | "ignored"; orderId?: string; attemptId?: string; note?: string }> {
  const entity = ((payload.payment as { entity?: object } | undefined)?.entity ?? null) as object | null;
  if (!entity) return { status: "ignored", note: "no payment entity" };
  const p = toInfo(entity);
  if (!p.orderId) return { status: "ignored", note: "payment without order" };
  const attempt = await findAttempt({ razorpayOrderId: p.orderId });
  if (!attempt) return { status: "ignored", note: "attempt_not_found" };
  const ids = { orderId: attempt.order_id, attemptId: attempt.id };

  if (event === "payment.captured" || event === "order.paid") {
    await markCaptured(attempt.order_id, attempt.id, p.status === "captured" ? p : { ...p, status: "captured" }, "webhook");
    return { status: "processed", ...ids };
  }
  if (event === "payment.authorized") {
    const captured = await captureRazorpayPayment(p.id, p.amount, p.currency).catch((e: unknown) => {
      log.warn("payment.capture_skipped", { paymentId: p.id, reason: e instanceof Error ? e.message : String(e) });
      return null;
    });
    if (captured?.status === "captured") { await markCaptured(attempt.order_id, attempt.id, captured, "webhook"); return { status: "processed", ...ids }; }
    return { status: "ignored", ...ids, note: "awaiting payment.captured" };
  }
  if (event === "payment.failed") {
    await recordFailure(attempt.id, p, "webhook");
    return { status: "processed", ...ids };
  }
  return { status: "ignored", ...ids, note: `unhandled ${event}` };
}

