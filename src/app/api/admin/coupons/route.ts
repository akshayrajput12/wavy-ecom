import { ok, parse, route } from "@/backend/_core/http";
import { bulkDeleteRoute } from "@/backend/admin/remove";
import { guard } from "@/backend/admin/_shared";
import { createCoupon, listCoupons } from "@/backend/admin/marketing";
import { CouponSchema } from "@/backend/admin/schemas/marketing";

export const GET = route("admin.coupons", async () => ok(await listCoupons()));

export const POST = route("admin.coupons", async ({ req }) => {
  const actor = await guard("coupons.write");
  return ok(await createCoupon(actor, await parse(req, CouponSchema)), { status: 201 });
});

/** Bulk delete `{ids}` (1-200); see backend/admin/remove.ts for how dependent data is handled. */
export const DELETE = bulkDeleteRoute("admin.coupons", "coupons");
