"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";

/** Inline two-step delete: "Delete" -> "Confirm delete" / "Cancel". */
export function DeleteButton({ onConfirm, busy, label = "Delete" }: { onConfirm: () => void; busy?: boolean; label?: string }) {
  const [ask, setAsk] = useState(false);
  if (!ask) return <Button type="button" variant="secondary" size="sm" onClick={() => setAsk(true)}>{label}</Button>;
  return (
    <span className="inline-flex items-center gap-2" role="group" aria-label="Confirm delete">
      <span className="text-meta text-danger">This cannot be undone.</span>
      <Button type="button" size="sm" loading={busy} className="bg-danger hover:bg-danger" onClick={onConfirm}>Confirm delete</Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setAsk(false)}>Cancel</Button>
    </span>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-meta text-ink-soft hover:text-ink"><ArrowLeft className="size-4" aria-hidden />{children}</Link>;
}

/** Form wrapper with explicit Save/Cancel bar; optional delete slot. */
export function EditorForm({ onSave, busy, back, children, danger }: { onSave: () => void; busy: boolean; back: string; children: ReactNode; danger?: ReactNode }) {
  const submit = (e: FormEvent) => { e.preventDefault(); onSave(); };
  return (
    <form onSubmit={submit} noValidate className="grid gap-6">
      {children}
      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-canvas py-3">
        <div className="flex gap-2">
          <Button type="submit" loading={busy}>Save</Button>
          <Link href={back} className="inline-flex h-11 items-center px-4 text-body text-ink-soft hover:text-ink">Cancel</Link>
        </div>
        {danger}
      </div>
    </form>
  );
}
