"use client";

import { useState } from "react";
import { Panel } from "@/components/admin/Panel";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatPrice } from "@/lib/format";
import type { AdminOrderDetail } from "@/types/admin";
import { useAct } from "../../orders/components/act";
import { toPaise, toRupees } from "../../orders/components/fmt";

type Refund = AdminOrderDetail["refunds"][number];

function RefundRow({ refund }: { refund: Refund }) {
  const { busy, run } = useAct();
  const [pid, setPid] = useState(refund.providerRefundId ?? "");
  const [why, setWhy] = useState("");
  const open = refund.status === "pending" || refund.status === "processing";
  const set = (status: "processing" | "processed" | "failed") =>
    run("PATCH", `refunds/${refund.id}`, { status, providerRefundId: pid.trim() || undefined, failureReason: status === "failed" ? why.trim() || undefined : undefined }, `Refund marked ${status}`);
  return (
    <li className="flex flex-col gap-2 py-3 text-body">
      <span className="flex flex-wrap items-center gap-2"><strong>{formatPrice(refund.amount)}</strong> <StatusBadge status={refund.status} /> <span className="t-meta">{refund.reason}</span></span>
      {refund.failureReason && <span className="t-meta">Failure: {refund.failureReason}</span>}
      {open && (
        <div className="flex flex-wrap items-end gap-2">
          <Input label="Provider refund id" value={pid} onChange={(e) => setPid(e.target.value)} className="w-56" />
          <Input label="Failure reason" value={why} onChange={(e) => setWhy(e.target.value)} className="w-56" />
          {refund.status === "pending" && <Button size="sm" variant="secondary" loading={busy} onClick={() => void set("processing")}>Processing</Button>}
          <Button size="sm" loading={busy} onClick={() => void set("processed")}>Mark processed</Button>
          <Button size="sm" variant="secondary" loading={busy} onClick={() => void set("failed")}>Mark failed</Button>
        </div>
      )}
    </li>
  );
}

/** Inline refund form (amount capped at the refundable balance) and the refund ledger. */
export function RefundPanel({ order }: { order: AdminOrderDetail }) {
  const { busy, run } = useAct();
  const [amount, setAmount] = useState(toRupees(order.refundable));
  const [reason, setReason] = useState("");
  const [key, setKey] = useState(() => crypto.randomUUID());
  const paise = toPaise(amount);
  const error = !Number.isFinite(paise) || paise <= 0 ? "Enter an amount above 0" : paise > order.refundable ? `At most ${formatPrice(order.refundable)}` : !reason.trim() ? "A reason is required" : "";

  return (
    <Panel title="Refunds" description={`Refundable now: ${formatPrice(order.refundable)}`}>
      {order.refunds.length > 0 && <ul className="mb-4 divide-y divide-line-soft">{order.refunds.map((r) => <RefundRow key={r.id} refund={r} />)}</ul>}
      {order.refundable > 0 ? (
        <form className="flex flex-wrap items-end gap-3" onSubmit={async (e) => {
          e.preventDefault();
          if (error) return;
          const res = await run("POST", `orders/${order.orderNumber}/refunds`, { amount: paise, reason: reason.trim(), idempotencyKey: key }, "Refund created (pending)");
          if (res.ok) { setKey(crypto.randomUUID()); setReason(""); }
        }}>
          <Input label="Amount (INR)" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-40" />
          <Input label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} className="min-w-56 flex-1" />
          <Button type="submit" loading={busy} disabled={!!error}>Create refund</Button>
          {error && (reason !== "" || paise > order.refundable) &&<p className="w-full text-meta text-danger">⚠ {error}</p>}
        </form>
      ) : <p className="t-meta">Nothing refundable (no captured balance left).</p>}
    </Panel>
  );
}
