"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader, Panel } from "@/components/admin/Panel";

/** Editor chrome: title, dirty indicator, explicit Save/Update, back link. */
export function EditorFrame({ title, isNew, dirty, saving, onSave, backHref, children }: {
  title: string; isNew: boolean; dirty: boolean; saving: boolean; onSave: () => void; backHref: string; children: ReactNode;
}) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(); }} noValidate>
      <PageHeader title={title} actions={<>
        {dirty ? <Badge tone="warning" dot>Unsaved changes</Badge> : !isNew && <Badge tone="success" dot>All changes saved</Badge>}
        <Link href={backHref} className="text-meta font-medium text-ink-soft underline-offset-4 hover:underline">Back to list</Link>
        <Button type="submit" size="sm" loading={saving} disabled={!dirty && !isNew}>{isNew ? "Save" : "Update"}</Button>
      </>} />
      <div className="grid gap-6">{children}</div>
    </form>
  );
}

/** Inline two-step delete: first click reveals `children` (impact text/inputs) and a "Confirm delete" button. */
export function DeleteZone({ noun, busy, disabled, onConfirm, children }: {
  noun: string; busy: boolean; disabled?: boolean; onConfirm: () => void; children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Panel title="Danger zone">
      {!open ? (
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>Delete {noun}</Button>
      ) : (
        <div className="grid gap-3" role="alert">
          {children}
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" loading={busy} disabled={disabled} onClick={onConfirm} className="bg-danger text-on-dark hover:bg-danger">Confirm delete</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </Panel>
  );
}
