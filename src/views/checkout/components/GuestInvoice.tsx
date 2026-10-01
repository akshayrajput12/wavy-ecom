"use client";

import { Download, FileText, Info } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Button, buttonClass } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { invoiceCopy as c } from "@/data/copy";

/**
 * Guest's one chance to keep the invoice: opens straight after the order (same InvoiceDocument as the PDF,
 * passed in as `children`), with a short-lived signed download link. Closing keeps a "View invoice" button.
 */
export function GuestInvoice({ href, children }: { href: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const download = (
    <a href={href} download className={buttonClass({ size: "md" })}>
      <Download className="size-4" aria-hidden /> {c.downloadPdf}
    </a>
  );
  return (
    <>
      <Button variant="secondary" size="lg" onClick={() => setOpen(true)}>
        <FileText className="size-4" aria-hidden /> {c.view}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={c.title} size="xl"
        footer={<div className="flex flex-wrap items-center justify-end gap-3">
          <Link href="/signup" className={buttonClass({ variant: "ghost" })}>{c.createAccount}</Link>
          {download}
        </div>}>
        <p role="note" className="mb-4 flex items-start gap-3 rounded-md bg-surface-warm p-4 text-body">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden /> {c.guestNote}
        </p>
        <div className="overflow-x-auto overscroll-x-contain pb-2">{children}</div>
      </Modal>
    </>
  );
}
