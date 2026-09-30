import type { PaymentInstructions } from "@/backend/payments/service";

export type RazorpayPayment = Extract<PaymentInstructions, { provider: "razorpay" }>;
export type RazorpayError = { code?: string; description?: string; reason?: string; metadata?: { payment_id?: string } };
export type RazorpayOutcome =
  | { kind: "success"; razorpayPaymentId: string; razorpayOrderId: string; razorpaySignature: string }
  | { kind: "failed"; error: RazorpayError }
  | { kind: "dismissed" }
  | { kind: "unavailable" };

type Handler = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type Instance = { open: () => void; on: (event: "payment.failed", cb: (r: { error: RazorpayError }) => void) => void };
declare global {
  interface Window { Razorpay?: new (options: Record<string, unknown>) => Instance }
}

const SRC = "https://checkout.razorpay.com/v1/checkout.js";
let loading: Promise<boolean> | undefined;

/** Loads Razorpay Checkout once; resolves false when blocked/offline (caller shows the failure panel). */
export function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  loading ??= new Promise<boolean>((resolve) => {
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.onload = () => resolve(!!window.Razorpay);
    s.onerror = () => { loading = undefined; s.remove(); resolve(false); };
    document.head.appendChild(s);
  });
  return loading;
}

/**
 * Opens Razorpay Checkout (UPI / cards / netbanking are Razorpay's own tabs) and resolves with one outcome.
 * In-modal retry is off so every attempt maps to one server payment attempt (retry goes through our API).
 */
export async function payWithRazorpay(p: RazorpayPayment): Promise<RazorpayOutcome> {
  if (!(await loadRazorpay()) || !window.Razorpay) return { kind: "unavailable" };
  const color = getComputedStyle(document.documentElement).getPropertyValue("--accent-deep").trim() || undefined;
  return new Promise<RazorpayOutcome>((resolve) => {
    let settled = false;
    const done = (o: RazorpayOutcome) => { if (!settled) { settled = true; resolve(o); } };
    const rzp = new window.Razorpay!({
      key: p.keyId, order_id: p.razorpayOrderId, amount: p.amount, currency: p.currency, name: p.name,
      description: `Order ${p.orderNumber}`, prefill: p.prefill, retry: { enabled: false }, theme: { color },
      handler: (r: Handler) => done({ kind: "success", razorpayPaymentId: r.razorpay_payment_id, razorpayOrderId: r.razorpay_order_id, razorpaySignature: r.razorpay_signature }),
      modal: { ondismiss: () => done({ kind: "dismissed" }), confirm_close: true },
    });
    rzp.on("payment.failed", (r) => done({ kind: "failed", error: r.error }));
    rzp.open();
  });
}

/** Razorpay error -> FAILURE_STAGES key (display only; the server derives its own stage). */
export function failureStage(e: RazorpayError): string {
  const s = `${e.reason ?? ""} ${e.code ?? ""}`.toLowerCase();
  if (s.includes("cancel")) return "user_cancelled";
  if (s.includes("insufficient")) return "insufficient_funds";
  if (s.includes("timeout") || s.includes("timed_out") || s.includes("otp")) return "otp_timeout";
  if (s.includes("network")) return "network_error";
  if (s.includes("gateway") || s.includes("server")) return "gateway_error";
  if (s.includes("bank") || s.includes("declin") || s.includes("authentication")) return "bank_declined";
  return "unknown";
}
