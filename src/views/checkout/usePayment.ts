"use client";

import { useState } from "react";
import type { CheckoutResult, PlacedOrder } from "@/backend/checkout/service";
import type { PaymentInstructions } from "@/backend/payments/service";
import { quoteErrorText } from "@/stores/cart";
import { api } from "@/stores/http";
import type { QuoteError } from "@/types/domain";
import { co } from "./copy";
import { failureStage, payWithRazorpay } from "./razorpay";

export type PayState =
  | { phase: "idle" | "placing" | "paying" | "verifying" | "done" }
  | { phase: "failed"; stage: string; order: PlacedOrder }
  | { phase: "error"; message: string };

const CAPTURED = ["captured", "already_captured", "duplicate"];

/**
 * Checkout submit + Razorpay flow (API_REFERENCE "Checkout + payment flow"). Place with an Idempotency-Key,
 * open Razorpay, verify; failures/dismissals are reported and land on the retry panel. `onPaid` navigates away.
 */
export function usePayment(onPaid: (order: PlacedOrder) => void) {
  const [state, setState] = useState<PayState>({ phase: "idle" });
  const paid = (order: PlacedOrder) => { setState({ phase: "done" }); onPaid(order); };

  async function run(payment: PaymentInstructions, order: PlacedOrder) {
    if (payment.provider === "none") return paid(order);
    setState({ phase: "paying" });
    const out = await payWithRazorpay(payment);
    if (out.kind === "success") {
      setState({ phase: "verifying" });
      const v = await api<{ result: string }>("/api/payments/razorpay/verify", {
        body: { orderId: payment.orderId, attemptId: payment.attemptId, ...out, kind: undefined },
      });
      if ((v.ok && CAPTURED.includes(v.data.result)) || (!v.ok && v.error.code === "payment_pending")) return paid(order);
      if (v.ok && v.data.result !== "failed") return setState({ phase: "error", message: co.payment.refund });
      // failed verify, or we lost the connection: retry is safe (the server never double-captures)
      return setState({ phase: "failed", stage: v.ok ? "bank_declined" : "network_error", order });
    }
    const error = out.kind === "failed" ? out.error : {};
    void api("/api/payments/failure", {
      body: {
        attemptId: payment.attemptId,
        stage: out.kind === "dismissed" ? "user_cancelled" : out.kind === "unavailable" ? "checkout_open" : undefined,
        code: error.code?.slice(0, 100), reason: error.reason?.slice(0, 200), description: error.description?.slice(0, 500),
        razorpayPaymentId: error.metadata?.payment_id,
      },
    });
    setState({ phase: "failed", stage: out.kind === "dismissed" ? "user_cancelled" : out.kind === "unavailable" ? "network_error" : failureStage(error), order });
  }

  async function place(body: unknown, idempotencyKey: string) {
    setState({ phase: "placing" });
    const r = await api<CheckoutResult>("/api/checkout", { body, headers: { "Idempotency-Key": idempotencyKey } });
    if (r.ok) return run(r.data.payment, r.data.order);
    const details = r.error.details as { order?: PlacedOrder } | QuoteError[] | undefined;
    if (details && !Array.isArray(details) && details.order) return setState({ phase: "failed", stage: "gateway_error", order: details.order });
    const quoteError = Array.isArray(details) ? details[0] : undefined;
    setState({ phase: "error", message: quoteError ? quoteErrorText(quoteError) : r.error.message });
  }

  async function retry() {
    if (state.phase !== "failed") return;
    const { order } = state;
    setState({ phase: "placing" });
    const r = await api<PaymentInstructions>("/api/payments/razorpay/retry", { body: { orderId: order.id, trackingToken: order.trackingToken } });
    if (r.ok) return run(r.data, order);
    setState({ phase: "failed", stage: "gateway_error", order });
  }

  return { state, place, retry, reset: () => setState({ phase: "idle" }) };
}
