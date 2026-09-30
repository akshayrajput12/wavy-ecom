import { getTax } from "@/backend/admin/repo";
import { TaxView } from "@/views/admin/tax/View";

export const metadata = { title: "Tax" };

export default async function Page() {
  return <TaxView settings={await getTax()} />;
}
