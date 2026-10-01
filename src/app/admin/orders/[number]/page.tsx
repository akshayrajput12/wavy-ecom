import { notFound } from "next/navigation";
import { getOrder } from "@/backend/admin/repo";
import { invoiceIfReady } from "@/backend/invoices/service";
import { OrderDetailView } from "@/views/admin/order-detail/View";

export const metadata = { title: "Order" };

export default async function Page({ params }: PageProps<"/admin/orders/[number]">) {
  const order = await getOrder((await params).number);
  if (!order) notFound();
  const invoice = await invoiceIfReady(order.id); // getOrder already enforced orders.read
  return <OrderDetailView order={order} invoice={invoice && { number: invoice.number, issuedAt: invoice.issuedAt }} />;
}
