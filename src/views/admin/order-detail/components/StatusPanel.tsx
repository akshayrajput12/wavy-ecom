"use client";

import { useState } from "react";
import { Panel } from "@/components/admin/Panel";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { AdminOrderDetail } from "@/types/admin";
import { useAct } from "../../orders/components/act";
import { ConfirmDelete } from "../../orders/components/ConfirmDelete";

/** Only transitions the DB allows are offered; cancelling is its own two-step action. */
export function StatusPanel({ order }: { order: AdminOrderDetail }) {
  const { busy, run } = useAct();
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const next = order.allowedTransitions.filter((s) => s !== "cancelled");
  const canCancel = order.allowedTransitions.includes("cancelled");
  const path = `orders/${order.orderNumber}`;

  return (
    <Panel title="Status">
      <p className="mb-3 flex items-center gap-2">Current <StatusBadge status={order.status} /> <StatusBadge status={order.paymentStatus} /></p>
      {next.length === 0 && !canCancel && <p className="t-meta">No further transitions from this status.</p>}
      {next.length > 0 && (
        <div className="flex flex-col gap-3">
          <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
          <div className="flex flex-wrap gap-2">
            {next.map((s) => (
              <Button key={s} size="sm" variant="secondary" loading={busy}
                onClick={async () => { if ((await run("PATCH", path, { status: s, note: note.trim() || undefined }, `Order marked ${s.replace(/_/g, " ")}`)).ok) setNote(""); }}>
                Mark {s.replace(/_/g, " ")}
              </Button>
            ))}
          </div>
        </div>
      )}
      {canCancel && (
        <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
          <Input label="Cancellation reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} hint="Releases stock and reverses coupon use. Refund is created separately." />
          <div><ConfirmDelete label="Cancel order" prompt="Cancel this order?" yes="Yes, cancel" busy={busy}
            onConfirm={() => void run("POST", `${path}/cancel`, { reason: reason.trim() || undefined }, "Order cancelled")} /></div>
        </div>
      )}
    </Panel>
  );
}
