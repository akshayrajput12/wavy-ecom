"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/admin/Fields";
import { Panel } from "@/components/admin/Panel";
import type { Redirect } from "@/data/admin/types";
import { mutate } from "../../api";

export function RedirectsPanel({ redirects }: { redirects: Redirect[] }) {
  const [rows, setRows] = useState(redirects);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [code, setCode] = useState<Redirect["code"]>(301);
  const error = from && !from.startsWith("/") ? "Must start with /" : rows.some((r) => r.from === from) ? "Already redirected" : from && from === to ? "Can't redirect to itself" : undefined;

  const add = () => {
    if (!from || !to || error) return;
    const r: Redirect = { id: crypto.randomUUID(), from, to, code };
    const before = rows;
    setRows([...rows, r]); setFrom(""); setTo("");
    // TODO(backend agent): call /api/admin/seo/redirects (applied in src/proxy.ts)
    void mutate("seo/redirects", r, { success: `Redirect ${from} → ${to} added`, rollback: () => setRows(before) });
  };
  const remove = (r: Redirect) => {
    const before = rows;
    setRows(rows.filter((x) => x.id !== r.id));
    void mutate(`seo/redirects/${r.id}/delete`, {}, { success: `Removed ${r.from}`, rollback: () => setRows(before) });
  };

  return (
    <Panel title="Redirects">
      <table className="mb-4 w-full text-body">
        <caption className="sr-only">Redirects</caption>
        <thead className="text-left text-meta text-ink-soft"><tr><th scope="col" className="py-1.5 font-medium">From</th><th scope="col" className="font-medium">To</th><th scope="col" className="font-medium">Type</th><th scope="col"><span className="sr-only">Remove</span></th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-line-soft">
              <td className="py-2 font-mono text-meta">{r.from}</td><td className="font-mono text-meta">{r.to}</td><td className="text-meta">{r.code}</td>
              <td className="text-right"><button type="button" aria-label={`Remove redirect from ${r.from}`} onClick={() => remove(r)} className="rounded-sm p-2 hover:bg-surface-warm"><Trash2 className="size-4" /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <form className="grid items-start gap-3 sm:grid-cols-[1fr_1fr_110px_auto]" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <Input label="From" placeholder="/old-path" value={from} onChange={(e) => setFrom(e.target.value.trim())} error={error} />
        <Input label="To" placeholder="/new-path" value={to} onChange={(e) => setTo(e.target.value.trim())} />
        <Select label="Type" value={code} onChange={(e) => setCode(Number(e.target.value) as Redirect["code"])}><option value={301}>301</option><option value={302}>302</option></Select>
        <Button type="submit" size="sm" className="sm:mt-7" disabled={!from || !to || !!error}>Add</Button>
      </form>
    </Panel>
  );
}
