"use client";

import { PlusIcon } from "@/components/ui/icons";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { accountCopy } from "@/data/copy";
import { api } from "@/stores/http";
import type { Address } from "@/types/domain";
import { AddressForm } from "@/views/checkout/components/AddressForm";
import type { AddressValues } from "@/views/checkout/schema";
import { ac } from "./copy";

/** Address book CRUD via /api/account/addresses. Default flag is exclusive (server clears the others). */
export function AddressesView({ initial }: { initial: Address[] }) {
  const [list, setList] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null); // address id, "new", or null
  const current = list.find((a) => a.id === editing);

  const refresh = async () => { const r = await api<Address[]>("/api/account/addresses"); if (r.ok) setList(r.data); };

  async function save(v: AddressValues) {
    const body = { ...v, country: "IN" };
    const r = editing === "new"
      ? await api<Address>("/api/account/addresses", { body })
      : await api<Address>(`/api/account/addresses/${editing}`, { method: "PATCH", body });
    if (!r.ok) return void toast.error(r.error.message);
    await refresh();
    setEditing(null);
    toast.success(ac.saved);
  }

  async function remove(a: Address) {
    if (!a.id || !window.confirm(ac.deleteConfirm)) return;
    const r = await api(`/api/account/addresses/${a.id}`, { method: "DELETE" });
    if (!r.ok) return void toast.error(r.error.message);
    setList((l) => l.filter((x) => x.id !== a.id));
    toast.success(ac.deleted);
  }

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <header className="grid gap-3"><p className="t-overline">{ac.overline}</p><h1 className="t-h1">{ac.addresses}</h1></header>
        {editing === null && <Button onClick={() => setEditing("new")}><PlusIcon className="size-4" /> {ac.addAddress}</Button>}
      </div>

      {editing !== null && (
        <section aria-label={editing === "new" ? ac.newAddress : ac.editAddress} className="rounded-xl border border-ink bg-surface p-5 sm:p-8">
          <AddressForm key={editing} defaultValues={current as Partial<AddressValues> | undefined} onSubmit={save}
            submitLabel={ac.save} onCancel={() => setEditing(null)} showDefaultToggle />
        </section>
      )}

      {list.length === 0 && editing === null ? (
        <EmptyState title={accountCopy.addressesEmpty} body={ac.addressesBody} action={<Button onClick={() => setEditing("new")}>{ac.addAddress}</Button>} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.map((a) => (
            <li key={a.id} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <p className="t-h3">{a.label ? `${a.label} · ` : ""}{a.name}</p>
                {a.isDefault && <Badge tone="dark">{ac.default}</Badge>}
              </div>
              <address className="flex-1 border-t border-line pt-3 text-body not-italic text-ink-soft">
                {[a.line1, a.line2, a.landmark].filter(Boolean).join(", ")}<br />{a.city}, {a.state} {a.postalCode}<br />{a.phone}
              </address>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setEditing(a.id ?? null)}>{ac.edit}<span className="sr-only"> {a.line1}</span></Button>
                <Button variant="ghost" onClick={() => void remove(a)}>{ac.delete}<span className="sr-only"> {a.line1}</span></Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
