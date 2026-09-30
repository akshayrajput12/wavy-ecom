import { getGateways } from "@/backend/admin/repo";
import { PaymentsView } from "@/views/admin/payments/View";

export const metadata = { title: "Payments" };

export default async function Page() {
  return <PaymentsView gateways={await getGateways()} />;
}
