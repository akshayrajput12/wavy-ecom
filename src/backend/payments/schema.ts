import { z } from "zod";

export const VerifySchema = z.object({
  orderId: z.string().uuid(),
  attemptId: z.string().uuid(),
  razorpayOrderId: z.string().min(1).max(64),
  razorpayPaymentId: z.string().min(1).max(64),
  razorpaySignature: z.string().min(1).max(256),
});
export type VerifyInput = z.infer<typeof VerifySchema>;

/** `stage` is optional: when omitted it is derived from Razorpay's error `reason`/`code`. */
export const FailureSchema = z.object({
  attemptId: z.string().uuid(),
  stage: z.enum(["checkout_open", "user_cancelled", "bank_declined", "otp_timeout", "insufficient_funds", "gateway_error", "network_error", "unknown"]).optional(),
  code: z.string().max(100).optional(),
  reason: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  razorpayPaymentId: z.string().max(64).optional(),
});
export type FailureInput = z.infer<typeof FailureSchema>;

export const RetrySchema = z.object({
  orderId: z.string().uuid(),
  /** Guest credential returned by /api/checkout; not needed when signed in as the order owner. */
  trackingToken: z.string().min(32).max(200).optional(),
});
