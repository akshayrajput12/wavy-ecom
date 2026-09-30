"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/admin/Fields";
import { Panel } from "@/components/admin/Panel";
import { formatDateTime } from "@/components/admin/format";
import type { OrderNote } from "@/data/admin/types";

export function Notes({ notes, onAdd, disabled }: { notes: OrderNote[]; onAdd: (body: string) => void; disabled?: boolean }) {
  const [body, setBody] = useState("");
  return (
    <Panel title="Internal notes" description="Visible to staff only.">
      {notes.length === 0 ? <p className="t-meta mb-3">No notes yet.</p> : (
        <ul className="mb-4 flex flex-col gap-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-sm bg-surface-warm p-3 text-body">
              {n.body}<span className="t-meta mt-1 block">{n.author} · {formatDateTime(n.at)}</span>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={(e) => { e.preventDefault(); if (body.trim()) { onAdd(body.trim()); setBody(""); } }} className="grid gap-2">
        <Textarea label="Add a note" value={body} onChange={(e) => setBody(e.target.value)} disabled={disabled} />
        <Button type="submit" size="sm" variant="secondary" className="justify-self-end" disabled={disabled || !body.trim()}>Add note</Button>
      </form>
    </Panel>
  );
}
