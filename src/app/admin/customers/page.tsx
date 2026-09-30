import { listCustomers } from "@/backend/admin/repo";
import { CustomerListQuery } from "@/backend/admin/schemas/settings";
import { CustomersView } from "@/views/admin/customers/View";
import { parseListQuery } from "@/views/admin/orders/components/query";

export const metadata = { title: "Customers" };

export default async function Page({ searchParams }: PageProps<"/admin/customers">) {
  return <CustomersView customers={await listCustomers(parseListQuery(CustomerListQuery, await searchParams))} />;
}
