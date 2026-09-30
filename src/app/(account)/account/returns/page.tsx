import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/backend/_core/auth";
import { listMyOrders } from "@/backend/orders/repo";
import { listMyReturns } from "@/backend/returns/service";
import { ReturnsView } from "@/views/returns/ReturnsView";

export const metadata: Metadata = { title: "Returns" };

export default async function ReturnsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account/returns");
  const [orders, returns] = await Promise.all([listMyOrders(session), listMyReturns(session)]);
  return <ReturnsView returns={returns} orders={orders} />;
}
