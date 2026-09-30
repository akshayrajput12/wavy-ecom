import type { Metadata } from "next";
import { getOrderByNumber } from "@/backend/orders/repo";
import { SuccessView } from "@/views/checkout/SuccessView";

type Props = { params: Promise<{ orderNumber: string }>; searchParams: Promise<{ guest?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: `Order ${orderNumber} confirmed` };
}

export default async function OrderSuccessPage({ params, searchParams }: Props) {
  const [{ orderNumber }, { guest }] = await Promise.all([params, searchParams]);
  const order = await getOrderByNumber(orderNumber);
  return <SuccessView number={orderNumber} order={order} guest={guest === "1"} />;
}
