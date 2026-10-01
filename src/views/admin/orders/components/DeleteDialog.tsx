"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Dialog } from "@/components/admin/Dialog";
import { Button } from "@/components/ui/Button";
import { adminCopy } from "@/data/copy";

const c = adminCopy.remove;
const danger = "border-danger text-danger hover:bg-danger hover:text-canvas";

/**
 * Danger trigger + confirm Dialog. `onConfirm` resolves true on success (the caller toasts and refreshes);
 * the dialog stays open on failure so the admin can retry or cancel.
 */
export function DeleteDialog({ title, body, onConfirm, label = c.delete, ariaLabel, compact }: {
  title: string; body: string; onConfirm: () => Promise<boolean>; label?: string; ariaLabel?: string; compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setBusy(true);
    const done = await onConfirm();
    setBusy(false);
    if (done) setOpen(false);
  };

  return (
    <>
      {compact ? (
        <button type="button" onClick={() => setOpen(true)} aria-label={ariaLabel ?? label}
          className="grid size-11 place-items-center rounded-sm text-danger hover:bg-surface-warm"><Trash2 className="size-4" aria-hidden /></button>
      ) : (
        <Button type="button" variant="secondary" size="sm" className={`h-11 sm:h-9 ${danger}`} aria-label={ariaLabel} onClick={() => setOpen(true)}>
          <Trash2 className="size-4" aria-hidden />{label}
        </Button>
      )}
      <Dialog open={open} onClose={() => !busy && setOpen(false)} title={title}
        footer={<>
          <Button type="button" variant="ghost" size="sm" className="h-11" disabled={busy} onClick={() => setOpen(false)}>{c.cancel}</Button>
          <Button type="button" size="sm" className="h-11 bg-danger hover:bg-danger/85" loading={busy} onClick={() => void confirm()}>{c.delete}</Button>
        </>}>
        <p className="text-body text-ink-soft">{body}</p>
      </Dialog>
    </>
  );
}
