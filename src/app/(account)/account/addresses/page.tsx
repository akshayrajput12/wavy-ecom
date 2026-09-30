import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/backend/_core/auth";
import { listAddresses } from "@/backend/account/repo";
import { AddressesView } from "@/views/account/AddressesView";

export const metadata: Metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account/addresses");
  return <AddressesView initial={await listAddresses(session)} />;
}
