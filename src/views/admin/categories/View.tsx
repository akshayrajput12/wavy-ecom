"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { PageHeader, Panel } from "@/components/admin/Panel";
import type { AdminCategory } from "@/types/admin";
import { mutate } from "../api";

/** Swap `id` with its previous/next sibling anywhere in the tree. Returns the new tree and the affected sibling list. */
function moveIn(nodes: AdminCategory[], id: string, dir: -1 | 1): { nodes: AdminCategory[]; siblings?: AdminCategory[] } {
  const i = nodes.findIndex((n) => n.id === id);
  if (i >= 0) {
    const j = i + dir;
    if (j < 0 || j >= nodes.length) return { nodes };
    const next = [...nodes];
    [next[i], next[j]] = [next[j], next[i]];
    return { nodes: next, siblings: next };
  }
  let siblings: AdminCategory[] | undefined;
  const out = nodes.map((n) => {
    const r = moveIn(n.children, id, dir);
    if (r.siblings) siblings = r.siblings;
    return r.siblings ? { ...n, children: r.nodes } : n;
  });
  return { nodes: out, siblings };
}

function Rows({ nodes, depth, onMove }: { nodes: AdminCategory[]; depth: number; onMove: (id: string, dir: -1 | 1) => void }) {
  return nodes.map((c, i) => (
    <li key={c.id}>
      <div className="flex items-center gap-3 border-b border-line py-3" style={{ paddingLeft: `${depth * 24}px` }}>
        <div className="relative size-12 shrink-0 overflow-hidden rounded-sm bg-surface-warm">
          {c.imageUrl && <Image src={c.imageUrl} alt={c.imageAlt ?? c.name} fill sizes="48px" className="object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/admin/categories/${c.slug}/edit`} className="font-medium text-ink underline-offset-4 hover:underline">{c.name}</Link>
          <p className="t-meta">/{c.slug} · {c.productCount} product{c.productCount === 1 ? "" : "s"}</p>
        </div>
        <div className="hidden gap-1.5 sm:flex">
          <Badge tone={c.isActive ? "success" : "neutral"} dot>{c.isActive ? "Active" : "Inactive"}</Badge>
          {c.showOnHome && <Badge tone="info">On home</Badge>}
        </div>
        <button type="button" className="grid size-11 place-items-center rounded-pill hover:bg-surface-warm disabled:opacity-30" disabled={i === 0} onClick={() => onMove(c.id, -1)} aria-label={`Move ${c.name} up`}><ArrowUp className="size-4" aria-hidden /></button>
        <button type="button" className="grid size-11 place-items-center rounded-pill hover:bg-surface-warm disabled:opacity-30" disabled={i === nodes.length - 1} onClick={() => onMove(c.id, 1)} aria-label={`Move ${c.name} down`}><ArrowDown className="size-4" aria-hidden /></button>
      </div>
      {c.children.length > 0 && <ul><Rows nodes={c.children} depth={depth + 1} onMove={onMove} /></ul>}
    </li>
  ));
}

export function CategoriesView({ categories }: { categories: AdminCategory[] }) {
  const [tree, setTree] = useState(categories);

  const onMove = async (id: string, dir: -1 | 1) => {
    const before = tree;
    const { nodes, siblings } = moveIn(tree, id, dir);
    if (!siblings) return;
    setTree(nodes);
    await mutate("POST", "categories/reorder", {
      items: siblings.map((s, sortOrder) => ({ id: s.id, parentId: s.parentId, sortOrder })),
    }, { success: "Order saved", rollback: () => setTree(before) });
  };

  return (
    <>
      <PageHeader title="Categories" description="Order and nest the shop's categories. Reordering saves immediately." actions={<ButtonLink href="/admin/categories/new" size="sm">New category</ButtonLink>} />
      <Panel>
        {tree.length === 0 ? <EmptyState title="No categories yet" action={<ButtonLink href="/admin/categories/new" size="sm">Create one</ButtonLink>} /> : <ul><Rows nodes={tree} depth={0} onMove={onMove} /></ul>}
      </Panel>
    </>
  );
}
