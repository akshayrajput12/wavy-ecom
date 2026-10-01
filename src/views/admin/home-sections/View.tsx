"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/admin/Fields";
import { PageHeader } from "@/components/admin/Panel";
import type { AdminHomeSection } from "@/types/admin";
import { HOME_SECTION_TYPE, type HomeSectionType } from "@/types/domain";
import { mutate } from "../api";
import { BulkBar, RemoveButton, SelectBox, useCanRemove, useSelection } from "../_kit/Remove";
import { SECTION_LABEL, SectionCard } from "./SectionCard";
import type { Lookups } from "./shared";

export function HomeSectionsView({ sections, lookups }: { sections: AdminHomeSection[]; lookups: Lookups }) {
  const router = useRouter();
  const [list, setList] = useState(sections);
  const [seen, setSeen] = useState(sections);
  const [drafts, setDrafts] = useState<{ key: string; type: HomeSectionType }[]>([]);
  const [adding, setAdding] = useState<HomeSectionType>("hero_carousel");
  const sel = useSelection();
  const canDelete = useCanRemove("home-sections");
  if (sections !== seen) { setSeen(sections); setList(sections); } // server data refreshed after a save

  const onMove = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const before = list;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    setList(next);
    const res = await mutate("POST", "home-sections/reorder", { ids: next.map((s) => s.id) }, { success: "Order saved", rollback: () => setList(before) });
    if (res.ok) router.refresh();
  };

  return (
    <>
      <PageHeader title="Home page" description="Sections appear on the storefront home page in this order. Each section saves on its own." actions={
        <>
          <Select label="Add section" value={adding} onChange={(e) => setAdding(e.target.value as HomeSectionType)}>
            {HOME_SECTION_TYPE.map((t) => <option key={t} value={t}>{SECTION_LABEL[t]}</option>)}
          </Select>
          <Button size="sm" onClick={() => setDrafts((d) => [...d, { key: crypto.randomUUID(), type: adding }])}>Add</Button>
        </>
      } />
      {canDelete && <BulkBar count={sel.ids.length} onClear={sel.clear}><RemoveButton noun="home-sections" ids={sel.ids} onDone={sel.clear} /></BulkBar>}
      <div className="grid gap-6">
        {list.map((s, i) => (
          <SectionCard key={s.id} section={s} type={s.type} lookups={lookups} onMove={(d) => onMove(i, d)} onDone={() => router.refresh()}
            select={canDelete && <SelectBox checked={sel.has(s.id)} onChange={() => sel.toggle(s.id)} label={s.title || SECTION_LABEL[s.type]} />} />
        ))}
        {drafts.map((d) => (
          <SectionCard key={d.key} section={null} type={d.type} lookups={lookups} onDone={() => { setDrafts((all) => all.filter((x) => x.key !== d.key)); router.refresh(); }} />
        ))}
        {list.length === 0 && drafts.length === 0 && <p className="t-meta">No sections yet. Add one above.</p>}
      </div>
    </>
  );
}
