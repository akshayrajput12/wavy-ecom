import { getSession } from "@/backend/_core/auth";
import { clientContext, ok, parse, route } from "@/backend/_core/http";
import { RetrySchema } from "@/backend/payments/schema";
import { retryPayment } from "@/backend/payments/service";

/** POST /api/payments/razorpay/retry { orderId, trackingToken? } -> PaymentInstructions (new attempt) */
export const POST = route("payments.retry", async ({ req }) => {
  const { orderId, trackingToken } = await parse(req, RetrySchema);
  const session = await getSession();
  return ok(await retryPayment(orderId, { trackingToken, userId: session?.userId }, clientContext(req)));
});
