import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAccountUser, getAddresses, getOrdersForUser, getReturnsForUser } from "@/backend/orders/repo";
import { AccountView } from "@/views/account/AccountView";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await getAccountUser();
  if (!user) redirect("/login?next=/account");
  const [orders, returns, addresses] = await Promise.all([getOrdersForUser(user.id), getReturnsForUser(user.id), getAddresses(user.id)]);
  return <AccountView user={user} orders={orders} returns={returns} defaultAddress={addresses.find((a) => a.isDefault) ?? addresses[0]} />;
}
