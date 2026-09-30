import { ok, parse, route } from "@/backend/_core/http";
import { guard } from "@/backend/admin/_shared";
import { reconcilePayment } from "@/backend/admin/payments";
import { ReconcileSchema } from "@/backend/admin/schemas/ops";

export const POST = route("admin.payments", async ({ req }) => {
  const actor = await guard("orders.write");
  const { orderNumber } = await parse(req, ReconcileSchema);
  return ok(await reconcilePayment(actor, orderNumber));
});
