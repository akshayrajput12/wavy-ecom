import { getSession } from "@/backend/_core/auth";
import { ok, parse, route } from "@/backend/_core/http";
import { CouponSchema } from "@/backend/pricing/schema";
import { validateCoupon } from "@/backend/pricing/service";

/** POST /api/cart/coupon { couponCode, items, ...quote fields } -> { coupon, quote } (coupon.error is a stable code) */
export const POST = route("pricing.coupon", async ({ req }) => {
  const input = await parse(req, CouponSchema);
  return ok(await validateCoupon(input, await getSession()), { headers: { "cache-control": "no-store" } });
});
