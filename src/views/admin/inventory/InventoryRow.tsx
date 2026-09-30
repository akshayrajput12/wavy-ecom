"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/admin/Fields";
import { AdjustSchema } from "@/backend/admin/schemas/ops";
import type { AdminInventoryRow, AdminMovement, Paginated } from "@/types/admin";
import { adminApi, mutate } from "../api";

const REASONS = ["restock", "adjustment", "damage", "correction", "initial", "return"] as const;
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

function stockLabel(r: AdminInventoryRow) {
  if (r.available <= 0) return <Badge tone="danger" dot>Out of stock</Badge>;
  if (r.low) return <Badge tone="warning" dot>Low stock (at or below {r.threshold})</Badge>;
  return <Badge tone="success" dot>In stock</Badge>;
}

function Ledger({ variantId, refreshKey }: { variantId: string; refreshKey: number }) {
  const [rows, setRows] = useState<AdminMovement[] | null>(null);
  useEffect(() => {
    let live = true;
    void adminApi<Paginated<AdminMovement>>("GET", `inventory/${variantId}/movements`).then((r) => { if (live) setRows(r.ok ? r.data.items : []); });
    return () => { live = false; };
  }, [variantId, refreshKey]);
  if (!rows) return <p className="t-meta">Loading ledger...</p>;
  if (!rows.length) return <p className="t-meta">No movements yet.</p>;
  return (
    <table className="w-full text-meta">
      <caption className="sr-only">Movement ledger</caption>
      <thead className="text-left text-ink-soft"><tr><th className="py-1 pr-3">When</th><th className="pr-3">Reason</th><th className="pr-3 text-right">On hand change</th><th className="pr-3 text-right">Reserved change</th><th className="pr-3 text-right">On hand after</th><th className="pr-3">By</th><th>Note</th></tr></thead>
      <tbody>
        {rows.map((m) => (
          <tr key={m.id} className="border-t border-line">
            <td className="py-1 pr-3">{when(m.createdAt)}</td><td className="pr-3">{m.reason}</td>
            <td className="pr-3 text-right">{m.deltaOnHand > 0 ? `+${m.deltaOnHand}` : m.deltaOnHand}</td>
            <td className="pr-3 text-right">{m.deltaReserved > 0 ? `+${m.deltaReserved}` : m.deltaReserved}</td>
            <td className="pr-3 text-right">{m.onHandAfter}</td><td className="pr-3">{m.actorEmail ?? "System"}</td><td>{m.note}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AdjustForm({ row, onDone }: { row: AdminInventoryRow; onDone: () => void }) {
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState<(typeof REASONS)[number]>("restock");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    const parsed = AdjustSchema.safeParse({ variantId: row.variantId, delta: Number(delta), reason, note: note.trim() || null, idempotencyKey: crypto.randomUUID() });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message);
    setError(undefined);
    setBusy(true);
    const res = await mutate("POST", "inventory/adjust", parsed.data, { success: "Stock adjusted" });
    setBusy(false);
    if (res.ok) { setDelta(""); setNote(""); onDone(); }
  };
  return (
    <div className="flex flex-wrap items-end gap-3">
      <Input label="Change (+ add, - remove)" type="number" step={1} value={delta} onChange={(e) => setDelta(e.target.value)} error={error} className="w-40" />
      <Select label="Reason" value={reason} onChange={(e) => setReason(e.target.value as (typeof REASONS)[number])}>
        {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
      </Select>
      <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="w-64" />
      <Button type="button" size="sm" loading={busy} onClick={submit}>Apply adjustment</Button>
    </div>
  );
}

export function InventoryRow({ row, onChanged }: { row: AdminInventoryRow; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  return (
    <>
      <tr className="border-b border-line">
        <td className="p-3"><p className="font-medium">{row.productName}</p><p className="t-meta">{row.title}</p></td>
        <td className="p-3 font-mono text-meta">{row.sku}</td>
        <td className="p-3 text-right">{row.onHand}</td><td className="p-3 text-right">{row.reserved}</td><td className="p-3 text-right font-medium">{row.available}</td>
        <td className="p-3">{stockLabel(row)}</td>
        <td className="p-3 text-right">
          <button type="button" className="inline-flex min-h-11 items-center gap-1 text-meta font-medium underline-offset-4 hover:underline" aria-expanded={open} onClick={() => setOpen(!open)}>
            Adjust and history <ChevronDown className={open ? "size-4 rotate-180" : "size-4"} aria-hidden />
          </button>
        </td>
      </tr>
      {open && (
        <tr className="border-b border-line bg-surface-warm"><td colSpan={7} className="grid gap-4 p-4">
          <AdjustForm row={row} onDone={() => { setTick((t) => t + 1); onChanged(); }} />
          <Ledger variantId={row.variantId} refreshKey={tick} />
        </td></tr>
      )}
    </>
  );
}
