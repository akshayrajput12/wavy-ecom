import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAccountUser, getOrderByNumber, getReturnsForUser } from "@/backend/orders/repo";
import { ReturnRequestView } from "@/views/returns/ReturnRequestView";
import { returnableItems } from "@/views/returns/eligibility";

export const metadata: Metadata = { title: "Request a return" };

export default async function NewReturnPage({ searchParams }: { searchParams: Promise<{ order?: string; item?: string }> }) {
  const [{ order: number, item }, user] = await Promise.all([searchParams, getAccountUser()]);
  if (!user) redirect("/login?next=/account/returns");
  const [order, returns] = await Promise.all([number ? getOrderByNumber(number) : undefined, getReturnsForUser(user.id)]);
  const items = order ? returnableItems(order, returns) : [];
  return <ReturnRequestView order={order} items={items} preselect={item} />;
}
