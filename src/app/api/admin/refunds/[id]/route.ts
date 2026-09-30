import { ok, parse, route } from "@/backend/_core/http";
import { guard } from "@/backend/admin/_shared";
import { updateRefund } from "@/backend/admin/fulfilment";
import { RefundUpdateSchema } from "@/backend/admin/schemas/ops";

/** Manual state for COD / bank-transfer refunds (processed is terminal and updates payment + order). */
export const PATCH = route<{ id: string }>("admin.refunds", async ({ req, params }) => {
  const actor = await guard("orders.refund");
  return ok(await updateRefund(actor, params.id, await parse(req, RefundUpdateSchema)));
});
