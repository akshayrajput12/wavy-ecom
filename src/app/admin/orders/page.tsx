import { listOrders } from "@/backend/admin/repo";
import { OrderListQuery } from "@/backend/admin/schemas/ops";
import { OrdersView } from "@/views/admin/orders/View";
import { parseListQuery } from "@/views/admin/orders/components/query";

export const metadata = { title: "Orders" };

const day = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

export default async function Page({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const [from, to] = [day(sp.from), day(sp.to)];
  const range = from && to ? { from: `${from}T00:00:00+05:30`, to: `${to}T23:59:59.999+05:30` } : undefined;
  return <OrdersView orders={await listOrders(parseListQuery(OrderListQuery, sp))} invoiceRange={range} />;
}
