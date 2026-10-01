import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/backend/_core/auth";
import { invoiceIfReady } from "@/backend/invoices/service";
import { CUSTOMER_CANCELLABLE, getMyOrder } from "@/backend/orders/repo";
import { OrderDetailView } from "@/views/orders/OrderDetailView";
import { returnableItems } from "@/views/returns/eligibility";

type Props = { params: Promise<{ number: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Order #${(await params).number}` };
}

export default async function OrderDetailPage({ params }: Props) {
  const [{ number }, session] = await Promise.all([params, getSession()]);
  if (!session) redirect(`/login?next=/account/orders/${encodeURIComponent(number)}`);
  const order = await getMyOrder(session, number);
  if (!order) notFound();
  const invoice = await invoiceIfReady(order.id); // issues it now if the order qualifies but no hook fired
  return (
    <OrderDetailView order={order} canCancel={CUSTOMER_CANCELLABLE.includes(order.status)} canReturn={returnableItems(order).length > 0}
      invoiceHref={invoice ? `/api/orders/${encodeURIComponent(order.number)}/invoice` : undefined} />
  );
}
