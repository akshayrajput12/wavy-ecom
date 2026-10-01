import type { Metadata } from "next";
import { getSession } from "@/backend/_core/auth";
import { guestInvoiceOffer } from "@/backend/invoices/access";
import { invoiceIfReady } from "@/backend/invoices/service";
import { getOrderForViewer } from "@/backend/orders/repo";
import { listShippingMethods } from "@/backend/shipping/repo";
import { SuccessView, type SuccessInvoice } from "@/views/checkout/SuccessView";

type Props = { params: Promise<{ orderNumber: string }>; searchParams: Promise<{ token?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Order ${(await params).orderNumber} confirmed` };
}

export default async function OrderSuccessPage({ params, searchParams }: Props) {
  const [{ orderNumber }, { token }, session] = await Promise.all([params, searchParams, getSession()]);
  const order = await getOrderForViewer(orderNumber, token).catch(() => null);
  const method = order?.shippingMethodName ? (await listShippingMethods()).find((m) => m.name === order.shippingMethodName) : undefined;
  // Signed in: a download link (the API re-checks ownership). Guest: only via the verified tracking token, briefly.
  let invoice: SuccessInvoice | null = null;
  if (order && session) invoice = (await invoiceIfReady(order.id)) ? { state: "owner", href: `/api/orders/${encodeURIComponent(orderNumber)}/invoice` } : null;
  else if (order) invoice = await guestInvoiceOffer(orderNumber, token).catch(() => null);
  return <SuccessView number={orderNumber} order={order} token={token} days={method} signedIn={!!session} invoice={invoice} />;
}
