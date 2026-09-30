import { listGateways, listPayments } from "@/backend/admin/repo";
import { PaymentListQuery } from "@/backend/admin/schemas/ops";
import { parseListQuery } from "@/views/admin/orders/components/query";
import { PaymentsView, type PaymentData } from "@/views/admin/payments/View";

export const metadata = { title: "Payments" };

async function load(sp: Awaited<PageProps<"/admin/payments">["searchParams"]>): Promise<PaymentData> {
  const q = parseListQuery(PaymentListQuery, sp);
  if (q.kind === "attempts") return { kind: "attempts", data: await listPayments({ ...q, kind: "attempts" }) };
  if (q.kind === "events") return { kind: "events", data: await listPayments({ ...q, kind: "events" }) };
  return { kind: "payments", data: await listPayments({ ...q, kind: "payments" }) };
}

export default async function Page({ searchParams }: PageProps<"/admin/payments">) {
  const [gateways, list] = await Promise.all([listGateways(), searchParams.then(load)]);
  return <PaymentsView gateways={gateways} list={list} />;
}
