import { ok, parse, route } from "@/backend/_core/http";
import { guard } from "@/backend/admin/_shared";
import { createRefund } from "@/backend/admin/fulfilment";
import { RefundSchema } from "@/backend/admin/schemas/ops";

export const POST = route<{ number: string }>("admin.refunds", async ({ req, params }) => {
  const actor = await guard("orders.refund");
  const res = await createRefund(actor, params.number, await parse(req, RefundSchema));
  return ok(res, { status: res.replayed ? 200 : 201 });
});
