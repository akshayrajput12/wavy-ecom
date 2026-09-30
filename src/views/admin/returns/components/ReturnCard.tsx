"use client";

import Link from "next/link";
import { useState } from "react";
import { Panel } from "@/components/admin/Panel";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatPrice } from "@/lib/format";
import type { AdminReturn } from "@/types/admin";
import { useAct } from "../../orders/components/act";
import { fmtDateTime, toPaise } from "../../orders/components/fmt";

const CONDITIONS = ["unused", "used", "damaged", "missing"] as const;
type Condition = (typeof CONDITIONS)[number];

/** One return with only the actions valid for its status. Each action is an explicit button (no auto-save). */
export function ReturnCard({ ret }: { ret: AdminReturn }) {
  const { busy, run } = useAct();
  const [refund, setRefund] = useState("");
  const [reject, setReject] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [cond, setCond] = useState<Record<string, Condition>>({});
  const path = `returns/${ret.id}`;
  const act = (body: object, ok: string) => void run("PATCH", path, body, ok);
  const s = ret.status;

  return (
    <Panel>
      <div className="flex flex-wrap items-center gap-3">
        <strong>{ret.rmaNumber}</strong><StatusBadge status={s} />
        {ret.orderNumber && <Link href={`/admin/orders/${ret.orderNumber}`} className="text-meta underline">Order {ret.orderNumber}</Link>}
        <span className="t-meta">{ret.reason.replace(/_/g, " ")} · {ret.resolution} · {fmtDateTime(ret.createdAt)}</span>
      </div>
      {ret.customerNote && <p className="mt-2 text-body">&ldquo;{ret.customerNote}&rdquo;</p>}
      {ret.refundAmount != null && <p className="t-meta mt-1">Approved refund {formatPrice(ret.refundAmount)}</p>}
      {ret.rejectionReason && <p className="t-meta mt-1">Rejected: {ret.rejectionReason}</p>}
      <ul className="mt-3 flex flex-col gap-2">
        {ret.items.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center gap-3 text-body">
            <span>Item x{i.quantity}</span>
            {s === "pickup_scheduled" || s === "approved" ? (
              <label className="flex items-center gap-2 text-meta">Condition
                <select value={cond[i.id] ?? "unused"} onChange={(e) => setCond({ ...cond, [i.id]: e.target.value as Condition })} className="h-9 rounded-sm border border-line bg-surface px-2 text-body">
                  {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
            ) : <span className="t-meta">{i.condition ?? "-"}{i.restocked ? " · restocked" : ""}</span>}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-end gap-2">
        {s === "requested" && (
          <>
            <Input label="Refund amount (INR, optional)" type="number" min="0" step="0.01" value={refund} onChange={(e) => setRefund(e.target.value)} className="w-52" />
            <Button size="sm" loading={busy} onClick={() => act({ action: "approve", refundAmount: refund ? toPaise(refund) : undefined }, "Return approved")}>Approve</Button>
            <Button size="sm" variant="secondary" onClick={() => setRejecting(!rejecting)}>Reject</Button>
          </>
        )}
        {s === "approved" && <Button size="sm" variant="secondary" loading={busy} onClick={() => act({ action: "schedule_pickup" }, "Pickup scheduled")}>Schedule pickup</Button>}
        {(s === "approved" || s === "pickup_scheduled") && (
          <Button size="sm" loading={busy} onClick={() => act({ action: "receive", items: ret.items.map((i) => ({ id: i.id, condition: cond[i.id] ?? "unused" })) }, "Marked received (unused items restocked)")}>Mark received</Button>
        )}
        {(s === "received" || s === "refunded" || s === "rejected") && <Button size="sm" variant="secondary" loading={busy} onClick={() => act({ action: "close" }, "Return closed")}>Close</Button>}
      </div>
      {rejecting && s === "requested" && (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <Input label="Rejection reason (sent to customer)" value={reject} onChange={(e) => setReject(e.target.value)} className="min-w-64 flex-1" />
          <Button size="sm" loading={busy} disabled={!reject.trim()} className="bg-danger hover:bg-danger" onClick={() => act({ action: "reject", rejectionReason: reject.trim() }, "Return rejected")}>Confirm reject</Button>
        </div>
      )}
    </Panel>
  );
}
