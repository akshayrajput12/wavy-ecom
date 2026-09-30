import { ok, parse, route } from "@/backend/_core/http";
import { guard } from "@/backend/admin/_shared";
import { createCoupon, listCoupons } from "@/backend/admin/marketing";
import { CouponSchema } from "@/backend/admin/schemas/marketing";

export const GET = route("admin.coupons", async () => ok(await listCoupons()));

export const POST = route("admin.coupons", async ({ req }) => {
  const actor = await guard("coupons.write");
  return ok(await createCoupon(actor, await parse(req, CouponSchema)), { status: 201 });
});
