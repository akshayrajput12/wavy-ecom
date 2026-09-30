import { ok, parse, route } from "@/backend/_core/http";
import { VerifySchema } from "@/backend/payments/schema";
import { verifyRazorpayPayment } from "@/backend/payments/service";

/** POST /api/payments/razorpay/verify { orderId, attemptId, razorpayOrderId, razorpayPaymentId, razorpaySignature } */
export const POST = route("payments.verify", async ({ req }) => ok(await verifyRazorpayPayment(await parse(req, VerifySchema))));
