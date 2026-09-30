import { FAILURE_STAGES, type FailureStage } from "@/data/checkout";
import type { AddressValues, ContactValues } from "./schema";

export type PlaceOrderBody = {
  contact: ContactValues; address: AddressValues & { country: "IN" };
  shippingMethodId: string; paymentMethodId: string; coupon?: string;
  lines: { variantId: string; quantity: number }[];
  /** set on retry so the server reuses the same order */
  orderNumber?: string;
};
export type PlaceResult =
  | { kind: "success"; orderNumber: string }
  | { kind: "redirect"; url: string }
  | { kind: "failed"; orderNumber: string; stage: FailureStage }
  | { kind: "error"; message: string };

type ApiBody = {
  ok?: boolean;
  data?: { orderNumber?: string; redirectUrl?: string; payment?: { status?: string; failureStage?: string } };
  error?: { message?: string };
};

const demoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL;
const asStage = (s?: string): FailureStage => (s && s in FAILURE_STAGES ? (s as FailureStage) : "gateway_error");

/**
 * POST /api/checkout with an idempotency key (same key on retry → no double charge).
 * Demo mode (no Supabase): a missing/unimplemented API resolves to a mock order so the flow is clickable.
 * Emails containing "+fail" simulate a bank decline on the first attempt.
 */
export async function placeOrder(body: PlaceOrderBody, idempotencyKey: string, attempt: number): Promise<PlaceResult> {
  let res: Response;
  try {
    res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json", "idempotency-key": idempotencyKey },
      body: JSON.stringify(body),
    });
  } catch {
    return demoMode ? mock(body, idempotencyKey, attempt)
      : { kind: "error", message: "We couldn't reach our servers. Your bag is saved — please try again." };
  }
  if (demoMode && (res.status === 404 || res.status === 501)) return mock(body, idempotencyKey, attempt);

  const json = (await res.json().catch(() => ({}))) as ApiBody;
  if (!res.ok || !json.ok) return { kind: "error", message: json.error?.message ?? "Something went wrong placing your order. Please try again." };
  const d = json.data ?? {};
  if (d.redirectUrl) return { kind: "redirect", url: d.redirectUrl };
  if (!d.orderNumber) return { kind: "error", message: "Order could not be confirmed. Please try again." };
  if (d.payment?.status === "failed") return { kind: "failed", orderNumber: d.orderNumber, stage: asStage(d.payment.failureStage) };
  return { kind: "success", orderNumber: d.orderNumber };
}

function mock(body: PlaceOrderBody, key: string, attempt: number): PlaceResult {
  const orderNumber = body.orderNumber ?? `BB${10000 + (parseInt(key.replace(/-/g, "").slice(0, 8), 16) % 90000)}`;
  if (body.contact.email.includes("+fail") && attempt === 0 && body.paymentMethodId !== "cod") {
    return { kind: "failed", orderNumber, stage: "bank_declined" };
  }
  return { kind: "success", orderNumber };
}
