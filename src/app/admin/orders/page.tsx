import { getOrders } from "@/backend/admin/repo";
import { OrdersView } from "@/views/admin/orders/View";

export const metadata = { title: "Orders" };

export default async function Page() {
  return <OrdersView orders={await getOrders()} />;
}
