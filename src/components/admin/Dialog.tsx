"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { adminCopy } from "@/data/copy";

/** Native <dialog> modal: focus trap, Esc and backdrop come from the platform. */
export function Dialog({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="admin-dialog-title"
      className="m-auto w-[min(560px,calc(100vw-2rem))] rounded-lg bg-surface p-0 text-ink shadow-lg backdrop:bg-overlay"
    >
      {open && (
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
            <h2 id="admin-dialog-title" className="min-w-0 text-body-lg font-semibold">{title}</h2>
            <button type="button" onClick={onClose} aria-label={adminCopy.close} className="-mr-2 grid size-11 shrink-0 place-items-center rounded-sm hover:bg-surface-2"><X className="size-4" aria-hidden /></button>
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
