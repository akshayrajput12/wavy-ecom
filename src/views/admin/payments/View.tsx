import { clsx } from "clsx";
import Link from "next/link";
import { PageHeader } from "@/components/admin/Panel";
import { StatusBadge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/format";
import type { AdminGateway, AdminPayment, AdminPaymentAttempt, AdminPaymentEvent, Paginated } from "@/types/admin";
import { PAYMENT_PROVIDER } from "@/types/domain";
import { fmtDateTime } from "../orders/components/fmt";
import { FilterBar, opts, Pager, SimpleTable, type Col } from "../orders/components/list";
import { Gateways } from "./components/Gateways";
import { Reconcile } from "./components/Reconcile";

export type PaymentData =
  | { kind: "payments"; data: Paginated<AdminPayment> }
  | { kind: "attempts"; data: Paginated<AdminPaymentAttempt> }
  | { kind: "events"; data: Paginated<AdminPaymentEvent> };

const order = (n: string | null) => (n ? <Link href={`/admin/orders/${n}`} className="font-medium hover:underline">{n}</Link> : "-");
const ids = (o: string | null, p: string | null) => <span className="t-meta break-all">{o ?? "-"}<br />{p ?? "-"}</span>;

const paymentCols: Col<AdminPayment>[] = [
  { header: "Order", cell: (p) => order(p.orderNumber) }, { header: "Provider", cell: (p) => `${p.provider}${p.method ? ` · ${p.method}` : ""}` },
  { header: "Status", cell: (p) => <StatusBadge status={p.status} /> },
  { header: "Amount", right: true, cell: (p) => formatPrice(p.amount) }, { header: "Refunded", right: true, cell: (p) => formatPrice(p.amountRefunded) },
  { header: "Last failure", cell: (p) => (p.lastFailureStage ? `${p.lastFailureStage} · ${p.lastFailureCode ?? "-"} · ${p.lastFailureReason ?? ""}` : "-") },
  { header: "Provider ids", cell: (p) => ids(p.providerOrderId, p.providerPaymentId) }, { header: "Created", cell: (p) => fmtDateTime(p.createdAt) },
];
const attemptCols: Col<AdminPaymentAttempt>[] = [
  { header: "Order", cell: (a) => order(a.orderNumber) }, { header: "Attempt", cell: (a) => `#${a.attemptNo} ${a.provider}${a.method ? ` · ${a.method}` : ""}` },
  { header: "Status", cell: (a) => <StatusBadge status={a.status} /> },
  { header: "Failure", cell: (a) => (a.failureStage || a.failureCode ? `${a.failureStage ?? "-"} · ${a.failureCode ?? "-"} · ${a.failureReason ?? ""}` : "-") },
  { header: "Amount", right: true, cell: (a) => formatPrice(a.amount) },
  { header: "Provider ids", cell: (a) => ids(a.providerOrderId, a.providerPaymentId) }, { header: "Started", cell: (a) => fmtDateTime(a.startedAt) },
];
const eventCols: Col<AdminPaymentEvent>[] = [
  { header: "Order", cell: (e) => order(e.orderNumber) }, { header: "Event", cell: (e) => <>{e.eventType}<span className="t-meta block">{e.provider} · {e.source}</span></> },
  { header: "Processing", cell: (e) => <><StatusBadge status={e.processingStatus} />{e.processingError && <span className="t-meta block">{e.processingError}</span>}</> },
  { header: "Signature", cell: (e) => (e.signatureValid === false ? "Invalid" : e.signatureValid ? "Valid" : "-") },
  { header: "Provider ids", cell: (e) => ids(e.providerEventId, e.providerPaymentId) }, { header: "Received", cell: (e) => fmtDateTime(e.receivedAt) },
];

const KINDS = ["payments", "attempts", "events"] as const;

export function PaymentsView({ gateways, list }: { gateways: AdminGateway[]; list: PaymentData }) {
  const d = list.data;
  return (
    <>
      <PageHeader title="Payments" description="Gateways, payments, attempts and webhook events. Failures show stage, code and reason." />
      <Gateways gateways={gateways} />
      <Reconcile />
      <nav aria-label="Payment records" className="mb-3 flex gap-2">
        {KINDS.map((k) => (
          <Link key={k} href={`/admin/payments?kind=${k}`} aria-current={list.kind === k ? "page" : undefined}
            className={clsx("inline-flex h-9 items-center rounded-pill border px-4 text-meta capitalize", list.kind === k ? "border-ink bg-ink text-on-dark" : "border-line hover:border-ink")}>{k}</Link>
        ))}
      </nav>
      <FilterBar key={list.kind} filters={[
        { key: "orderNumber", label: "Order number" }, { key: "provider", label: "Provider", options: opts(PAYMENT_PROVIDER) },
        { key: "status", label: "Status" }, ...(list.kind === "attempts" ? [{ key: "failureStage", label: "Failure stage" }] : []),
        { key: "from", label: "From", type: "date" as const }, { key: "to", label: "To", type: "date" as const },
      ]} />
      {list.kind === "payments" && <SimpleTable caption="Payments" rows={list.data.items} cols={paymentCols} getId={(r) => r.id} empty="No payments match" />}
      {list.kind === "attempts" && <SimpleTable caption="Payment attempts" rows={list.data.items} cols={attemptCols} getId={(r) => r.id} empty="No attempts match" />}
      {list.kind === "events" && <SimpleTable caption="Payment events" rows={list.data.items} cols={eventCols} getId={(r) => r.id} empty="No events match" />}
      <Pager page={d.page} pageSize={d.pageSize} total={d.total} />
    </>
  );
}
