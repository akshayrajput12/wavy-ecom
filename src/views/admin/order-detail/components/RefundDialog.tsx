"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/admin/Dialog";
import { Select } from "@/components/admin/Fields";
import { formatPrice } from "@/lib/format";

const REASONS = ["Customer return", "Item out of stock", "Damaged in transit", "Duplicate payment", "Goodwill"];

export function RefundDialog({ open, max, onClose, onRefund }: { open: boolean; max: number; onClose: () => void; onRefund: (paise: number, reason: string) => void }) {
  const [amount, setAmount] = useState(String(max / 100));
  const [reason, setReason] = useState("");
  const paise = Math.round(Number(amount) * 100);
  const error = !(paise > 0) ? "Enter an amount" : paise > max ? `Max refundable is ${formatPrice(max)}` : undefined;
  return (
    <Dialog open={open} onClose={onClose} title="Refund payment"
      footer={<><Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" disabled={!!error || !reason} onClick={() => onRefund(paise, reason)}>Refund {paise > 0 && !error ? formatPrice(paise) : ""}</Button></>}>
      <div className="grid gap-4">
        <Input label="Amount (₹)" type="number" min={0} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} error={error} hint={`Captured: ${formatPrice(max)}`} />
        <Select label="Reason" value={reason} onChange={(e) => setReason(e.target.value)}>
          <option value="">Select…</option>{REASONS.map((r) => <option key={r}>{r}</option>)}
        </Select>
        <p className="t-meta">Refunds go back to the original payment method via the gateway. This is logged in the audit trail.</p>
      </div>
    </Dialog>
  );
}
