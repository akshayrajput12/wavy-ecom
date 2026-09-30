import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAccountUser, getOrdersForUser, getReturnsForUser } from "@/backend/orders/repo";
import { ReturnsView } from "@/views/returns/ReturnsView";
import { returnableItems } from "@/views/returns/eligibility";

export const metadata: Metadata = { title: "Returns" };

export default async function ReturnsPage() {
  const user = await getAccountUser();
  if (!user) redirect("/login?next=/account/returns");
  const [orders, returns] = await Promise.all([getOrdersForUser(user.id), getReturnsForUser(user.id)]);
  const eligible = orders.filter((o) => returnableItems(o, returns).length > 0).map((o) => o.number);
  return <ReturnsView returns={returns} eligibleOrders={eligible} />;
}
