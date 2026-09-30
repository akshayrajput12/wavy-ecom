import "server-only";
import Razorpay from "razorpay";
import { ApiError } from "@/backend/_core/http";

/** Razorpay SDK adapter. Keys: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET. */
let sdk: Razorpay | undefined;

export function razorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new ApiError(503, "gateway_not_configured", "Online payments are not configured");
  return { keyId, keySecret, webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? "" };
}

function client() {
  const { keyId, keySecret } = razorpayConfig();
  sdk ??= new Razorpay({ key_id: keyId, key_secret: keySecret });
  return sdk;
}

export async function createRazorpayOrder(p: { amount: number; currency: string; receipt: string; notes: Record<string, string> }) {
  const o = await client().orders.create({ amount: p.amount, currency: p.currency, receipt: p.receipt.slice(0, 40), notes: p.notes });
  return { id: o.id, amount: Number(o.amount), currency: o.currency };
}

export interface RazorpayPaymentInfo {
  id: string; orderId: string | null; status: string; amount: number; currency: string; method: string | null;
  errorCode: string | null; errorReason: string | null; errorDescription: string | null; raw: Record<string, unknown>;
}

export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPaymentInfo> {
  return toInfo(await client().payments.fetch(paymentId));
}

/** Captures an `authorized` payment (no-op if the account auto-captures). */
export async function captureRazorpayPayment(paymentId: string, amount: number, currency: string): Promise<RazorpayPaymentInfo> {
  return toInfo(await client().payments.capture(paymentId, amount, currency));
}

export function toInfo(p: object): RazorpayPaymentInfo {
  const x = p as Record<string, unknown>;
  const s = (v: unknown) => (typeof v === "string" && v ? v : null);
  return {
    id: String(x.id), orderId: s(x.order_id), status: String(x.status ?? ""), amount: Number(x.amount ?? 0),
    currency: String(x.currency ?? "INR"), method: s(x.method), errorCode: s(x.error_code), errorReason: s(x.error_reason),
    errorDescription: s(x.error_description), raw: x,
  };
}
