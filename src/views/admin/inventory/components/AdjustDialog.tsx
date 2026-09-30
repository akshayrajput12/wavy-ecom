"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/admin/Dialog";
import { Select, Textarea } from "@/components/admin/Fields";
import type { StockRow } from "../View";

export function AdjustDialog({ row, reasons, onClose, onApply }: {
  row: StockRow | null; reasons: string[]; onClose: () => void; onApply: (row: StockRow, delta: number, reason: string, note: string) => void;
}) {
  return (
    <Dialog open={!!row} onClose={onClose} title={row ? `Adjust ${row.sku}` : "Adjust stock"}>
      {row && <AdjustForm key={row.id} row={row} reasons={reasons} onClose={onClose} onApply={onApply} />}
    </Dialog>
  );
}

function AdjustForm({ row, reasons, onClose, onApply }: { row: StockRow; reasons: string[]; onClose: () => void; onApply: (row: StockRow, delta: number, reason: string, note: string) => void }) {
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const n = Number(delta);
  const error = delta && !Number.isInteger(n) ? "Whole units only" : row.stock + n < 0 ? `Can't go below 0 (on hand: ${row.stock})` : undefined;
  const valid = delta !== "" && n !== 0 && !error && reason;

  return (
    <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); if (valid) onApply(row, n, reason, note); }}>
      <p className="t-meta">{row.productName} · {row.color} · {row.size} — on hand <strong className="text-ink">{row.stock}</strong></p>
      <Input label="Change (use − to remove)" type="number" step={1} value={delta} onChange={(e) => setDelta(e.target.value)} error={error}
        hint={delta && !error ? `New on hand: ${row.stock + n}` : undefined} autoFocus />
      <Select label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required>
        <option value="">Select a reason…</option>
        {reasons.map((r) => <option key={r}>{r}</option>)}
      </Select>
      <Textarea label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button type="submit" size="sm" disabled={!valid}>Apply adjustment</Button>
      </div>
    </form>
  );
}
