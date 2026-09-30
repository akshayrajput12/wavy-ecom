"use client";

import { FolderPlus, Pencil, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/admin/Dialog";
import { PageHeader, Panel } from "@/components/admin/Panel";
import { slugify } from "@/lib/format";
import type { Category } from "@/types/domain";
import { mutate } from "../api";

type Edit = { mode: "create"; parentId: string | null } | { mode: "rename"; cat: Category };

export function CategoriesView({ categories }: { categories: Category[] }) {
  const [cats, setCats] = useState(categories);
  const [edit, setEdit] = useState<Edit | null>(null);
  const [name, setName] = useState("");
  const children = (id: string | null) => cats.filter((c) => c.parentId === id).sort((a, b) => a.sortOrder - b.sortOrder);

  const open = (e: Edit) => { setEdit(e); setName(e.mode === "rename" ? e.cat.name : ""); };
  const save = () => {
    if (!edit || name.trim().length < 2) return;
    const before = cats;
    if (edit.mode === "create") {
      const cat: Category = { id: `cat-${crypto.randomUUID().slice(0, 8)}`, name: name.trim(), slug: slugify(name), parentId: edit.parentId, sortOrder: children(edit.parentId).length + 1 };
      setCats([...cats, cat]);
      // TODO(backend agent): call /api/admin/categories
      void mutate("categories", cat, { success: `Created “${cat.name}”`, rollback: () => setCats(before) });
    } else {
      setCats(cats.map((c) => (c.id === edit.cat.id ? { ...c, name: name.trim(), slug: slugify(name) } : c)));
      void mutate(`categories/${edit.cat.id}`, { name }, { success: "Category renamed", rollback: () => setCats(before) });
    }
    setEdit(null);
  };
  const remove = (c: Category) => {
    const before = cats;
    setCats(cats.filter((x) => x.id !== c.id));
    void mutate(`categories/${c.id}/delete`, {}, { success: `Deleted “${c.name}”`, rollback: () => setCats(before) });
  };

  const row = (c: Category, depth: number) => {
    const kids = children(c.id);
    return (
      <li key={c.id}>
        <div className="flex items-center gap-2 border-t border-line-soft py-2.5" style={{ paddingLeft: depth * 24 }}>
          <span className="flex-1 text-body"><span className="font-medium">{c.name}</span> <span className="t-meta">/{c.slug}</span></span>
          {depth === 0 && <IconBtn label={`Add subcategory to ${c.name}`} onClick={() => open({ mode: "create", parentId: c.id })}><FolderPlus className="size-4" /></IconBtn>}
          <IconBtn label={`Rename ${c.name}`} onClick={() => open({ mode: "rename", cat: c })}><Pencil className="size-4" /></IconBtn>
          <IconBtn label={kids.length ? `${c.name} has subcategories — move or delete them first` : `Delete ${c.name}`} disabled={kids.length > 0} onClick={() => remove(c)}><Trash2 className="size-4" /></IconBtn>
        </div>
        {kids.length > 0 && <ul>{kids.map((k) => row(k, depth + 1))}</ul>}
      </li>
    );
  };

  return (
    <>
      <PageHeader title="Categories" description="Department → category tree used by navigation, filters and breadcrumbs."
        actions={<Button size="sm" onClick={() => open({ mode: "create", parentId: null })}>New department</Button>} />
      <Panel><ul className="-mt-2.5">{children(null).map((c) => row(c, 0))}</ul></Panel>
      <Dialog open={!!edit} onClose={() => setEdit(null)} title={edit?.mode === "rename" ? "Rename category" : "New category"}
        footer={<><Button variant="ghost" size="sm" onClick={() => setEdit(null)}>Cancel</Button><Button size="sm" onClick={save} disabled={name.trim().length < 2}>Save</Button></>}>
        <form onSubmit={(e) => { e.preventDefault(); save(); }}>
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} hint={name ? `Slug: ${slugify(name)}` : undefined} autoFocus />
        </form>
      </Dialog>
    </>
  );
}

function IconBtn({ label, children, ...rest }: { label: string; children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button type="button" aria-label={label} title={label} className="rounded-sm p-2 hover:bg-surface-warm disabled:opacity-30" {...rest}>{children}</button>;
}
