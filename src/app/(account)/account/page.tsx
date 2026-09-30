import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/backend/_core/auth";
import { getAccountUser, listAddresses } from "@/backend/account/repo";
import { listMyOrders } from "@/backend/orders/repo";
import { listMyReturns } from "@/backend/returns/service";
import { AccountView } from "@/views/account/AccountView";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const [session, user] = await Promise.all([getSession(), getAccountUser()]);
  if (!session || !user) redirect("/login?next=/account");
  const [orders, returns, addresses] = await Promise.all([listMyOrders(session), listMyReturns(session), listAddresses(session)]);
  return <AccountView user={user} orders={orders} returns={returns} defaultAddress={addresses.find((a) => a.isDefault) ?? addresses[0]} />;
}
