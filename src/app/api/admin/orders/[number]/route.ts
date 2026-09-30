import { ok, parse, route } from "@/backend/_core/http";
import { guard, notFound } from "@/backend/admin/_shared";
import { getOrder, setOrderStatus } from "@/backend/admin/orders";
import { OrderStatusSchema } from "@/backend/admin/schemas/ops";

type P = { number: string };

export const GET = route<P>("admin.orders", async ({ params }) => ok((await getOrder(params.number)) ?? notFound("Order")));

/** {status, note?}; status "cancelled" runs cancel_order. */
export const PATCH = route<P>("admin.orders", async ({ req, params }) => {
  const actor = await guard("orders.write");
  const { status, note } = await parse(req, OrderStatusSchema);
  return ok(await setOrderStatus(actor, params.number, status, note));
});
