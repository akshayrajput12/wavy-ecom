"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import type { Address } from "@/types/domain";
import { AddressForm } from "@/views/checkout/components/AddressForm";
import type { AddressValues } from "@/views/checkout/schema";

// ponytail: CRUD is local state until backend exposes /api/account/addresses; swap setList for fetch calls then
export function AddressesView({ initial }: { initial: Address[] }) {
  const [list, setList] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null); // address id, "new", or null

  const save = (v: AddressValues) => {
    const id = editing === "new" || !editing ? crypto.randomUUID() : editing;
    setList((l) => {
      const next = editing === "new" ? [...l, { ...v, id, country: "IN" }] : l.map((a) => (a.id === id ? { ...a, ...v } : a));
      return v.isDefault ? next.map((a) => ({ ...a, isDefault: a.id === id })) : next;
    });
    setEditing(null);
    toast.success("Address saved");
  };
  const remove = (id?: string) => {
    if (!window.confirm("Delete this address?")) return;
    setList((l) => l.filter((a) => a.id !== id));
    toast.success("Address deleted");
  };
  const current = list.find((a) => a.id === editing);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="t-h1">Addresses</h1>
        {editing === null && <Button size="sm" onClick={() => setEditing("new")}><Plus className="size-4" aria-hidden /> Add address</Button>}
      </div>

      {editing !== null && (
        <section aria-label={editing === "new" ? "New address" : "Edit address"} className="rounded-md border border-ink bg-surface p-5">
          <AddressForm key={editing} defaultValues={current as Partial<AddressValues> | undefined} onSubmit={save}
            submitLabel="Save address" onCancel={() => setEditing(null)} showDefaultToggle />
        </section>
      )}

      {list.length === 0 && editing === null ? (
        <EmptyState title="No saved addresses" body="Save an address to check out faster." />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.map((a) => (
            <li key={a.id} className="flex flex-col gap-3 rounded-md border border-line bg-surface p-5">
              <div className="flex items-center gap-2">
                <p className="font-medium">{a.name}</p>
                {a.isDefault && <Badge tone="dark">Default</Badge>}
              </div>
              <address className="flex-1 text-body not-italic text-ink-soft">
                {[a.line1, a.line2].filter(Boolean).join(", ")}<br />{a.city}, {a.state} {a.postalCode}<br />{a.phone}
              </address>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setEditing(a.id ?? null)}>Edit<span className="sr-only"> {a.line1}</span></Button>
                <Button size="sm" variant="ghost" onClick={() => remove(a.id)}>Delete<span className="sr-only"> {a.line1}</span></Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
