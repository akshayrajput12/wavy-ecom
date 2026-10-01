"use client";

import { Download, RefreshCw } from "lucide-react";
import { Panel } from "@/components/admin/Panel";
import { useCan } from "@/components/admin/useRole";
import { Button, buttonClass } from "@/components/ui/Button";
import { invoiceCopy } from "@/data/copy";
import { formatDateIST } from "@/lib/format";
import { useAct } from "../../orders/components/act";

const c = invoiceCopy.admin;

/** Download (orders.read) and re-render the stored PDF from the frozen snapshot (orders.write). */
export function InvoicePanel({ orderNumber, invoice }: { orderNumber: string; invoice: { number: string; issuedAt: string } | null }) {
  const canRegenerate = useCan("orders.write");
  const { busy, run } = useAct();
  const path = `orders/${encodeURIComponent(orderNumber)}/invoice`;
  return (
    <Panel title={c.panel}>
      {!invoice ? <p className="t-meta">{c.none}</p> : (
        <div className="flex flex-col gap-3">
          <p className="text-body tabular-nums">{c.issued(invoice.number, formatDateIST(invoice.issuedAt))}</p>
          <div className="flex flex-wrap gap-2">
            <a href={`/api/admin/${path}`} download className={buttonClass({ size: "sm" })}>
              <Download className="size-4" aria-hidden /> {invoiceCopy.download}
            </a>
            {canRegenerate && (
              <Button size="sm" variant="secondary" loading={busy} onClick={() => void run("POST", path, {}, c.regenerated)}>
                <RefreshCw className="size-4" aria-hidden /> {c.regenerate}
              </Button>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}
