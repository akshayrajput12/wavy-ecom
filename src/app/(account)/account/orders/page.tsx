import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/backend/_core/auth";
import { listMyOrders } from "@/backend/orders/repo";
import { OrdersView } from "@/views/orders/OrdersView";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account/orders");
  return <OrdersView orders={await listMyOrders(session)} />;
}
