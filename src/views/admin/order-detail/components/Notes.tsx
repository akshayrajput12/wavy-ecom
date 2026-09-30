"use client";

import { useState } from "react";
import { Panel } from "@/components/admin/Panel";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/admin/Fields";
import type { AdminOrderDetail } from "@/types/admin";
import { useAct } from "../../orders/components/act";
import { fmtDateTime } from "../../orders/components/fmt";

export function Notes({ order }: { order: AdminOrderDetail }) {
  const { busy, run } = useAct();
  const [body, setBody] = useState("");
  return (
    <Panel title="Internal notes">
      <ul className="mb-3 flex flex-col gap-2">
        {order.staffNotes.map((n) => (
          <li key={n.id} className="rounded-sm bg-surface-warm p-3 text-body">{n.body}<span className="t-meta block">{n.author ?? "Staff"} · {fmtDateTime(n.at)}</span></li>
        ))}
        {order.staffNotes.length === 0 && <li className="t-meta">No notes yet.</li>}
      </ul>
      <Textarea label="Add note" value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} />
      <Button className="mt-2" size="sm" loading={busy} disabled={!body.trim()}
        onClick={async () => { if ((await run("POST", `orders/${order.orderNumber}/notes`, { body: body.trim() }, "Note added")).ok) setBody(""); }}>Add note</Button>
    </Panel>
  );
}

export function StatusHistory({ history }: { history: AdminOrderDetail["history"] }) {
  return (
    <Panel title="Status history">
      <ol className="flex flex-col gap-3">
        {[...history].reverse().map((h) => (
          <li key={h.id} className="text-body">
            <span className="flex items-center gap-2">{h.fromStatus && <><StatusBadge status={h.fromStatus} /> to</>} <StatusBadge status={h.toStatus} /></span>
            <span className="t-meta block">{h.actorType} · {fmtDateTime(h.createdAt)}{h.note ? ` · ${h.note}` : ""}</span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
