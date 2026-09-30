import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAccountUser, getAddresses } from "@/backend/orders/repo";
import { AddressesView } from "@/views/account/AddressesView";

export const metadata: Metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const user = await getAccountUser();
  if (!user) redirect("/login?next=/account/addresses");
  return <AddressesView initial={await getAddresses(user.id)} />;
}
