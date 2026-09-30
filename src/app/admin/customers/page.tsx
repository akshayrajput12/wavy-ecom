import { getCustomers } from "@/backend/admin/repo";
import { CustomersView } from "@/views/admin/customers/View";

export const metadata = { title: "Customers" };

export default async function Page() {
  return <CustomersView customers={await getCustomers()} />;
}
