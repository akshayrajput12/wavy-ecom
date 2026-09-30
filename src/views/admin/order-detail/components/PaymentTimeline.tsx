import { Panel } from "@/components/admin/Panel";
import { StatusBadge } from "@/components/ui/Badge";
import type { AdminOrderDetail } from "@/types/admin";
import { fmtDateTime } from "../../orders/components/fmt";

interface Entry { at: string; title: string; status: string; lines: string[] }

function entries(o: AdminOrderDetail): Entry[] {
  const out: Entry[] = [
    ...o.attempts.map((a) => ({
      at: a.startedAt, status: a.status, title: `Attempt #${a.attemptNo} · ${a.provider}${a.method ? ` · ${a.method}` : ""}`,
      lines: [
        a.failureStage || a.failureCode || a.failureReason ? `Failed at stage "${a.failureStage ?? "unknown"}" · code ${a.failureCode ?? "-"} · ${a.failureReason ?? "no reason given"}${a.failureSource ? ` (source ${a.failureSource})` : ""}` : "",
        `Provider order ${a.providerOrderId ?? "-"} · payment ${a.providerPaymentId ?? "-"}`,
      ],
    })),
    ...o.events.map((e) => ({
      at: e.receivedAt, status: e.processingStatus, title: `Webhook ${e.eventType} (${e.source})`,
      lines: [`Event ${e.providerEventId}${e.providerPaymentId ? ` · payment ${e.providerPaymentId}` : ""}`, e.signatureValid === false ? "Signature INVALID" : "", e.processingError ?? ""],
    })),
    ...o.refunds.map((r) => ({ at: r.createdAt, status: r.status, title: "Refund", lines: [`${r.reason}`, r.providerRefundId ? `Provider refund ${r.providerRefundId}` : "", r.failureReason ?? ""] })),
  ];
  return out.sort((a, b) => a.at.localeCompare(b.at));
}

/** Attempts, gateway webhooks and refunds in one chronological list with failure detail. */
export function PaymentTimeline({ order }: { order: AdminOrderDetail }) {
  const list = entries(order);
  return (
    <Panel title="Payment timeline" description={`${order.paymentProvider} · ${order.payments.length} payment(s), ${order.attempts.length} attempt(s)`}>
      {list.length === 0 ? <p className="t-meta">No payment activity recorded.</p> : (
        <ol className="flex flex-col gap-4">
          {list.map((e, i) => (
            <li key={i} className="flex flex-col gap-1 border-l-2 border-line pl-3 text-body">
              <span className="flex flex-wrap items-center gap-2 font-medium">{e.title} <StatusBadge status={e.status} /></span>
              {e.lines.filter(Boolean).map((l) => <span key={l} className="t-meta break-words">{l}</span>)}
              <span className="t-meta">{fmtDateTime(e.at)}</span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
