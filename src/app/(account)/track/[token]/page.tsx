import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrderTracking } from "@/backend/orders/repo";
import { getStoreSettings } from "@/backend/settings/repo";
import { TrackingView } from "@/views/tracking/TrackingView";

type Props = { params: Promise<{ token: string }> };

export const metadata: Metadata = { title: "Track your order", robots: { index: false, follow: false } };

export default async function TrackPage({ params }: Props) {
  const { token } = await params;
  const [order, settings] = await Promise.all([getOrderTracking(decodeURIComponent(token)), getStoreSettings()]);
  if (!order) notFound();
  return <TrackingView order={order} supportEmail={settings?.supportEmail} />;
}
