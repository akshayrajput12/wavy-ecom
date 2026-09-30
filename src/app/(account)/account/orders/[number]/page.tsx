import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/backend/_core/auth";
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
  return <OrderDetailView order={order} canCancel={CUSTOMER_CANCELLABLE.includes(order.status)} canReturn={returnableItems(order).length > 0} />;
}
