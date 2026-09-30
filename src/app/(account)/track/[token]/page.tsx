import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrderByTrackingToken } from "@/backend/orders/repo";
import { TrackingView } from "@/views/tracking/TrackingView";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const order = await getOrderByTrackingToken((await params).token);
  return { title: order ? `Tracking order #${order.number}` : "Tracking not found" };
}

export default async function TrackPage({ params }: Props) {
  const order = await getOrderByTrackingToken((await params).token);
  if (!order) notFound();
  return <TrackingView order={order} />;
}
