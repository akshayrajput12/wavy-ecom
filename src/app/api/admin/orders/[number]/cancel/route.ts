import { ok, parse, route } from "@/backend/_core/http";
import { guard } from "@/backend/admin/_shared";
import { cancelOrder } from "@/backend/admin/orders";
import { CancelSchema } from "@/backend/admin/schemas/ops";

export const POST = route<{ number: string }>("admin.orders", async ({ req, params }) => {
  const actor = await guard("orders.write");
  const { reason } = await parse(req, CancelSchema);
  return ok(await cancelOrder(actor, params.number, reason));
});
