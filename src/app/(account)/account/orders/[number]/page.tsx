import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAccountUser, getOrderByNumber, getReturnsForUser } from "@/backend/orders/repo";
import { OrderDetailView } from "@/views/orders/OrderDetailView";
import { returnableItems } from "@/views/returns/eligibility";

type Props = { params: Promise<{ number: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Order #${(await params).number}` };
}

export default async function OrderDetailPage({ params }: Props) {
  const { number } = await params;
  const [order, user] = await Promise.all([getOrderByNumber(number), getAccountUser()]);
  if (!order || !user) notFound();
  const returns = await getReturnsForUser(user.id);
  return <OrderDetailView order={order} canReturn={returnableItems(order, returns).length > 0} />;
}
