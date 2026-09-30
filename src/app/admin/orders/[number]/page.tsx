import { notFound } from "next/navigation";
import { getOrder } from "@/backend/admin/repo";
import { OrderDetailView } from "@/views/admin/order-detail/View";

export const metadata = { title: "Order" };

export default async function Page({ params }: PageProps<"/admin/orders/[number]">) {
  const order = await getOrder((await params).number);
  if (!order) notFound();
  return <OrderDetailView order={order} />;
}
