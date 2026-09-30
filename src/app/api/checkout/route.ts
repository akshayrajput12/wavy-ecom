import { getSession } from "@/backend/_core/auth";
import { ApiError, clientContext, ok, parse, route } from "@/backend/_core/http";
import { CheckoutSchema, IdempotencyKey } from "@/backend/checkout/schema";
import { placeOrder } from "@/backend/checkout/service";

/** POST /api/checkout  header Idempotency-Key  body CheckoutSchema -> { order, payment } */
export const POST = route("checkout", async ({ req }) => {
  const key = IdempotencyKey.safeParse(req.headers.get("idempotency-key"));
  if (!key.success) throw new ApiError(400, "idempotency_key_required", "Idempotency-Key header (8-200 chars) is required");
  const input = await parse(req, CheckoutSchema);
  const result = await placeOrder(input, key.data, await getSession(), clientContext(req));
  return ok(result, { status: result.order.replayed ? 200 : 201, headers: { "cache-control": "no-store" } });
});
