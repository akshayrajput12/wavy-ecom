import { listOrders } from "@/backend/admin/repo";
import { OrderListQuery } from "@/backend/admin/schemas/ops";
import { OrdersView } from "@/views/admin/orders/View";
import { parseListQuery } from "@/views/admin/orders/components/query";

export const metadata = { title: "Orders" };

export default async function Page({ searchParams }: PageProps<"/admin/orders">) {
  return <OrdersView orders={await listOrders(parseListQuery(OrderListQuery, await searchParams))} />;
}
