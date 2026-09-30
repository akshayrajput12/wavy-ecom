"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { accountCopy } from "@/data/copy";
import { api } from "@/stores/http";
import { ac } from "@/views/account/copy";

/** Confirm + POST /api/orders/:number/cancel, then refresh the server-rendered order. */
export function CancelOrder({ number }: { number: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function cancel() {
    setBusy(true);
    setError(undefined);
    const r = await api<{ refundRequired: boolean }>(`/api/orders/${encodeURIComponent(number)}/cancel`, { body: { reason: reason.trim() || undefined } });
    setBusy(false);
    if (!r.ok) return setError(r.error.message || ac.cancelFailed);
    setOpen(false);
    toast.success(accountCopy.cancelled, { description: r.data.refundRequired ? ac.refundNote : undefined });
    router.refresh();
  }

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>{accountCopy.cancel}</Button>
      <Modal open={open} onClose={() => setOpen(false)} title={accountCopy.cancelConfirm} size="sm"
        footer={<div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>{ac.keep}</Button>
          <Button onClick={() => void cancel()} loading={busy}>{accountCopy.cancel}</Button>
        </div>}>
        <label htmlFor="cancel-reason" className="text-meta font-medium">{ac.cancelReason}</label>
        <textarea id="cancel-reason" rows={3} maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)}
          className="mt-1.5 w-full rounded-sm border border-line bg-surface p-3 text-body focus:border-ink focus:outline-none" />
        {error && <p role="alert" className="mt-2 text-meta text-danger">⚠ {error}</p>}
      </Modal>
    </>
  );
}
