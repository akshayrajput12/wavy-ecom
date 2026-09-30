import { ApiError, ok, route } from "@/backend/_core/http";
import { getOrderTracking } from "@/backend/orders/repo";

/** GET /api/orders/track?token= -> OrderTracking */
export const GET = route("orders.track", async ({ req }) => {
  const tracking = await getOrderTracking(req.nextUrl.searchParams.get("token") ?? "");
  if (!tracking) throw new ApiError(404, "order_not_found", "No order matches that tracking link");
  return ok(tracking, { headers: { "cache-control": "private, no-store" } });
});
