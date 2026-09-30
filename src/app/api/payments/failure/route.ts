import { ok, parse, route } from "@/backend/_core/http";
import { FailureSchema } from "@/backend/payments/schema";
import { reportPaymentFailure } from "@/backend/payments/service";

/** POST /api/payments/failure { attemptId, stage?, code?, reason?, description?, razorpayPaymentId? } */
export const POST = route("payments.failure", async ({ req }) => ok(await reportPaymentFailure(await parse(req, FailureSchema))));
