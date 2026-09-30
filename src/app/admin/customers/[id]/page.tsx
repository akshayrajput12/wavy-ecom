import { notFound } from "next/navigation";
import { getCustomer } from "@/backend/admin/repo";
import { CustomerDetailView } from "@/views/admin/customer-detail/View";

export const metadata = { title: "Customer" };

export default async function Page({ params }: PageProps<"/admin/customers/[id]">) {
  const data = await getCustomer((await params).id);
  if (!data) notFound();
  return <CustomerDetailView data={data} />;
}
