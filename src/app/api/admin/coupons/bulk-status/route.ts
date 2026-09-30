import { ok, parse, route } from "@/backend/_core/http";
import { guard } from "@/backend/admin/_shared";
import { bulkCouponStatus } from "@/backend/admin/marketing";
import { BulkCouponStatusSchema } from "@/backend/admin/schemas/marketing";

export const POST = route("admin.coupons", async ({ req }) => {
  const actor = await guard("coupons.write");
  return ok(await bulkCouponStatus(actor, await parse(req, BulkCouponStatusSchema)));
});
