/** Pure Razorpay helpers (no SDK, no env) so they are unit-tested: signatures + error mapping. */
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Enums } from "@/types/database";

function safeEqualHex(expected: string, given: string): boolean {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(given, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

const hmac = (secret: string, data: string) => createHmac("sha256", secret).update(data).digest("hex");

/** Checkout callback: signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyPaymentSignature(razorpayOrderId: string, razorpayPaymentId: string, signature: string, keySecret: string): boolean {
  if (!razorpayOrderId || !razorpayPaymentId || !signature || !keySecret) return false;
  return safeEqualHex(hmac(keySecret, `${razorpayOrderId}|${razorpayPaymentId}`), signature);
}

/** Webhook: X-Razorpay-Signature = HMAC_SHA256(raw body, webhook secret). Must use the raw body string. */
export function verifyWebhookSignature(rawBody: string, signature: string | null, webhookSecret: string): boolean {
  if (!signature || !webhookSecret) return false;
  return safeEqualHex(hmac(webhookSecret, rawBody), signature);
}

const METHODS = new Set(["card", "upi", "netbanking", "wallet", "emi", "paylater"]);
export const toPaymentMethod = (m: unknown): Enums<"payment_method"> | null =>
  typeof m === "string" && METHODS.has(m) ? (m as Enums<"payment_method">) : null;

/** Razorpay error_reason / error_code -> our failure stage (payment_failure_stage enum). */
export function toFailureStage(reason?: string | null, code?: string | null): Enums<"payment_failure_stage"> {
  const r = `${reason ?? ""} ${code ?? ""}`.toLowerCase();
  if (/cancel|user_abort|closed|dismiss/.test(r)) return "user_cancelled";
  if (/insufficient/.test(r)) return "insufficient_funds";
  if (/otp|timed?_?out|timeout|authentication_failed/.test(r)) return "otp_timeout";
  if (/declin|bank|card_|issuer|invalid_card|expired/.test(r)) return "bank_declined";
  if (/risk|fraud/.test(r)) return "risk_blocked";
  if (/network/.test(r)) return "network_error";
  if (/gateway|server_error|technical/.test(r)) return "gateway_error";
  return "unknown";
}
