import { ok, parse, route } from "@/backend/_core/http";
import { guard, notFound } from "@/backend/admin/_shared";
import { deleteCoupon, getCoupon, updateCoupon } from "@/backend/admin/marketing";
import { CouponPatchSchema } from "@/backend/admin/schemas/marketing";

type P = { id: string };

export const GET = route<P>("admin.coupons", async ({ params }) => ok((await getCoupon(params.id)) ?? notFound("Coupon")));

/** `targets`, when sent, replaces the whole target list. */
export const PATCH = route<P>("admin.coupons", async ({ req, params }) => {
  const actor = await guard("coupons.write");
  return ok(await updateCoupon(actor, params.id, await parse(req, CouponPatchSchema)));
});

export const DELETE = route<P>("admin.coupons", async ({ params }) => {
  const actor = await guard("coupons.write");
  return ok(await deleteCoupon(actor, params.id));
});
