"use client";

import { Download } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { invoiceCopy } from "@/data/copy";

const c = invoiceCopy.admin;
const MAX = 200; // mirrors BULK_INVOICE_LIMIT (server enforces it)
export const SELECT_NAME = "invoiceOrder";

/** Row checkbox (server-renderable); BulkInvoices reads checked ones from the DOM on download. */
export function SelectOrder({ id, number }: { id: string; number: string }) {
  return <input type="checkbox" name={SELECT_NAME} value={id} aria-label={c.selectRow(number)} className="size-4 accent-ink" />;
}

/**
 * Wraps the server-rendered orders table: select rows (or the whole page) and download ONE combined PDF,
 * or every invoice issued in the filtered date range. `range` = the From/To filter as IST day bounds.
 */
export function BulkInvoices({ children, range }: { children: ReactNode; range?: { from: string; to: string } }) {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const boxes = () => [...(ref.current?.querySelectorAll<HTMLInputElement>(`input[name="${SELECT_NAME}"]`) ?? [])];
  const sync = () => { const all = boxes(); setTotal(all.length); setCount(all.filter((b) => b.checked).length); };
  const all = total > 0 && count === total;

  const download = async (body: unknown) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/invoices", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        toast.error(c.failed, { description: j?.error?.message ?? `HTTP ${res.status}` });
        return;
      }
      const name = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? "invoices.pdf";
      const url = URL.createObjectURL(await res.blob());
      Object.assign(document.createElement("a"), { href: url, download: name }).click();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      const skipped = Number(res.headers.get("x-invoices-skipped") ?? 0);
      if (skipped) toast.message(c.skipped(skipped));
    } catch {
      toast.error(c.failed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={ref} onChange={sync}>
      <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface px-4 py-2.5" role="toolbar" aria-label={c.bulk}>
        <label className="flex min-h-11 items-center gap-2 text-meta font-medium">
          <input type="checkbox" className="size-4 accent-ink" checked={all}
            onChange={(e) => { boxes().forEach((b) => { b.checked = e.target.checked; }); sync(); }} />
          {c.selectPage}
        </label>
        <span className="t-meta" aria-live="polite">{c.selected(count)} · {c.max(MAX)}</span>
        <span className="ml-auto flex flex-wrap gap-2">
          {range && (
            <Button size="sm" variant="ghost" loading={busy} onClick={() => void download(range)}>{c.range}</Button>
          )}
          <Button size="sm" loading={busy} disabled={!count || count > MAX}
            onClick={() => void download({ orderIds: boxes().filter((b) => b.checked).map((b) => b.value) })}>
            <Download className="size-4" aria-hidden /> {c.bulk}
          </Button>
        </span>
      </div>
      {children}
    </div>
  );
}
