"use client";

import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface PickOption { id: string; label: string }

const icon = "grid size-11 place-items-center rounded-pill text-ink-soft hover:bg-surface-warm hover:text-ink disabled:opacity-30";

/** Ordered multi-picker: search + add, up/down reorder, remove. `value` is the ordered id list. */
export function ItemPicker({ label, options, value, onChange, max = 500 }: {
  label: string; options: PickOption[]; value: string[]; onChange: (ids: string[]) => void; max?: number;
}) {
  const [q, setQ] = useState("");
  const byId = new Map(options.map((o) => [o.id, o.label]));
  const needle = q.trim().toLowerCase();
  const matches = needle ? options.filter((o) => !value.includes(o.id) && o.label.toLowerCase().includes(needle)).slice(0, 8) : [];
  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <div className="grid gap-3 sm:col-span-2">
      <Input label={`${label}: search to add`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a name" disabled={value.length >= max} />
      {matches.length > 0 && (
        <ul className="rounded-md border border-line" aria-label="Search results">
          {matches.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 border-b border-line px-3 py-1 last:border-0">
              <span className="text-body">{m.label}</span>
              <Button type="button" size="sm" variant="ghost" onClick={() => { onChange([...value, m.id]); setQ(""); }}>Add</Button>
            </li>
          ))}
        </ul>
      )}
      {needle && matches.length === 0 && <p className="t-meta">No matches.</p>}
      {value.length === 0 ? <p className="t-meta">Nothing selected yet.</p> : (
        <ol className="rounded-md border border-line" aria-label={`Selected ${label}`}>
          {value.map((id, i) => (
            <li key={id} className="flex items-center gap-2 border-b border-line px-3 last:border-0">
              <span className="w-6 text-meta text-ink-soft">{i + 1}</span>
              <span className="flex-1 text-body">{byId.get(id) ?? id}</span>
              <button type="button" className={icon} disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${byId.get(id) ?? id} up`}><ArrowUp className="size-4" aria-hidden /></button>
              <button type="button" className={icon} disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${byId.get(id) ?? id} down`}><ArrowDown className="size-4" aria-hidden /></button>
              <button type="button" className={icon} onClick={() => onChange(value.filter((x) => x !== id))} aria-label={`Remove ${byId.get(id) ?? id}`}><X className="size-4" aria-hidden /></button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
