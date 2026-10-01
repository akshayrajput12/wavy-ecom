"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { BulkAction } from "@/components/admin/DataTable";
import { useCan } from "@/components/admin/useRole";
import { Button } from "@/components/ui/Button";
import { adminCopy } from "@/data/copy";
import type { Permission } from "../rbac";
import { adminApi } from "../api";
import { DeleteDialog } from "../orders/components/DeleteDialog";

const rc = adminCopy.remove;
const tc = adminCopy.table;

/** Admin API resource -> the write permission its DELETE needs (mirrors backend/admin/remove.ts). */
const PERM = {
  products: "catalog.write", categories: "catalog.write", collections: "catalog.write",
  coupons: "coupons.write", offers: "offers.write", campaigns: "campaigns.write", blog: "blog.write",
  faqs: "content.write", pages: "content.write", "home-sections": "content.write", testimonials: "testimonials.write",
  "seo-overrides": "seo.write", redirects: "seo.write",
  "shipping-zones": "settings.shipping.manage", "shipping-methods": "settings.shipping.manage",
} as const satisfies Record<keyof typeof rc.nouns, Permission>;
export type Noun = keyof typeof PERM;

export const useCanRemove = (noun: Noun) => useCan(PERM[noun]);

/**
 * Delete trigger + confirm dialog for one or many rows: `DELETE /api/admin/<noun> {ids}`, toasts the
 * deleted/archived split, refreshes server data, then goes `back` (editors) and/or calls `onDone` (clear a selection).
 * Renders nothing for roles without the permission.
 */
export function RemoveButton({ noun, ids, name, compact, back, onDone }: {
  noun: Noun; ids: string[]; name?: string; compact?: boolean; back?: string; onDone?: () => void;
}) {
  const router = useRouter();
  const allowed = useCanRemove(noun);
  if (!allowed || !ids.length) return null;
  const n = rc.nouns[noun];
  const confirm = async () => {
    const res = await adminApi<{ deleted: number; archived: number }>("DELETE", noun, { ids });
    if (!res.ok) { toast.error(rc.failed, { description: res.error }); return false; }
    toast.success(rc.done(res.data.deleted, res.data.archived, n.one, n.many, n.kept));
    router.refresh();
    if (back) router.push(back);
    onDone?.();
    return true;
  };
  return <DeleteDialog compact={compact} title={rc.confirmTitle(ids.length, n.one, n.many)} body={n.effect}
    ariaLabel={name ? rc.deleteLabel(name) : undefined} onConfirm={confirm} />;
}

/** DataTable bulk action: "Delete" with the confirm dialog; clears the selection when done. */
export const bulkDelete = (noun: Noun): BulkAction => ({
  label: rc.delete, render: (ids, clear) => <RemoveButton noun={noun} ids={ids} onDone={clear} />,
});

/** Row selection for lists that are not a DataTable (tree, cards, panels). */
export function useSelection() {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  return { ids: [...sel], has: (id: string) => sel.has(id), toggle, set: (ids: string[]) => setSel(new Set(ids)), clear: () => setSel(new Set()) };
}

export function SelectBox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="grid size-11 shrink-0 cursor-pointer place-items-center">
      <input type="checkbox" checked={checked} onChange={onChange} aria-label={rc.select(label)} className="size-4 accent-ink" />
    </label>
  );
}

/** Sticky "N selected · actions · Clear" bar; hidden when nothing is selected. */
export function BulkBar({ count, onClear, children }: { count: number; onClear: () => void; children: ReactNode }) {
  if (!count) return null;
  return (
    <div role="region" aria-label={tc.bulkActions} className="sticky top-16 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-md border border-line bg-surface-warm p-3">
      <span className="text-meta font-medium">{tc.selected(count)}</span>
      {children}
      <Button size="sm" variant="ghost" onClick={onClear}>{tc.clear}</Button>
    </div>
  );
}
