import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/backend/_core/auth";
import { getMyOrder } from "@/backend/orders/repo";
import { ReturnRequestView } from "@/views/returns/ReturnRequestView";
import { returnableItems } from "@/views/returns/eligibility";

export const metadata: Metadata = { title: "Request a return" };

export default async function NewReturnPage({ searchParams }: { searchParams: Promise<{ order?: string; item?: string }> }) {
  const [{ order: number, item }, session] = await Promise.all([searchParams, getSession()]);
  if (!session) redirect("/login?next=/account/returns");
  const order = number ? await getMyOrder(session, number) : null;
  return <ReturnRequestView order={order} items={order ? returnableItems(order) : []} preselect={item} />;
}
