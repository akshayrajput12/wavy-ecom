import { ok, route } from "@/backend/_core/http";
import { handleRazorpayWebhook } from "@/backend/payments/webhook";

/** POST /api/webhooks/razorpay (raw body; X-Razorpay-Signature, X-Razorpay-Event-Id). Non-2xx makes Razorpay retry. */
export const POST = route("payments.webhook", async ({ req }) =>
  ok(await handleRazorpayWebhook(await req.text(), req.headers.get("x-razorpay-signature"), req.headers.get("x-razorpay-event-id"))));
