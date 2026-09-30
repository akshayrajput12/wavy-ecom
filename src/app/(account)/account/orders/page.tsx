import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAccountUser, getOrdersForUser } from "@/backend/orders/repo";
import { OrdersView } from "@/views/orders/OrdersView";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  const user = await getAccountUser();
  if (!user) redirect("/login?next=/account/orders");
  return <OrdersView orders={await getOrdersForUser(user.id)} />;
}
