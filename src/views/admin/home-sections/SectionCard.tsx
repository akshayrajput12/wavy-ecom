"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toggle } from "@/components/admin/Fields";
import { HOME_CONFIG } from "@/backend/admin/schemas/content";
import type { AdminHomeSection } from "@/types/admin";
import type { HomeSectionType } from "@/types/domain";
import { mutate } from "../api";
import { ScheduleFields } from "../category-editor/EntityFields";
import { dirtyKey, fromLocal, nul, serverErrors, toLocal } from "../category-editor/shared";
import { ConfigFields } from "./ConfigFields";
import { Preview } from "./Preview";
import { clean, uploadBlobs, type Cfg, type Lookups } from "./shared";

export const SECTION_LABEL: Record<HomeSectionType, string> = {
  hero_carousel: "Hero carousel", category_grid: "Category grid", collection_rail: "Collection rail", product_carousel: "Product carousel",
  floating_showcase: "Floating showcase", promo_banner: "Promo banner", testimonials: "Testimonials", blog_rail: "Blog rail", newsletter: "Newsletter",
  tear_reveal: "Tear reveal",
};
const icon = "grid size-11 place-items-center rounded-pill text-ink-soft hover:bg-surface-warm disabled:opacity-30";

/**
 * One home section: type-specific form, its own Save, inline preview. `section` null = a new, unsaved section of `type`.
 * `select` is the bulk-selection checkbox slot.
 */
export function SectionCard({ section, type, lookups, onMove, onDone, select }: {
  section: AdminHomeSection | null; type: HomeSectionType; lookups: Lookups;
  onMove?: (dir: -1 | 1) => void; onDone: () => void; select?: ReactNode;
}) {
  const [files] = useState(() => new Map<string, File>());
  const initial = {
    title: section?.title ?? "", subtitle: section?.subtitle ?? "", isActive: section?.isActive ?? true,
    startsAt: toLocal(section?.startsAt), endsAt: toLocal(section?.endsAt), cfg: (section?.config ?? {}) as Cfg,
  };
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(dirtyKey(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const dirty = dirtyKey(form) !== saved;
  const set = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));

  const save = async () => {
    const parsed = HOME_CONFIG[type].safeParse(clean(form.cfg));
    if (!parsed.success) return setErrors(Object.fromEntries([...parsed.error.issues].reverse().map((i) => [["config", ...i.path].join("."), i.message])));
    setErrors({});
    setBusy(true);
    let config: Cfg;
    try { config = (await uploadBlobs(clean(form.cfg), files)) as Cfg; } catch { return setBusy(false); }
    const body = { config, title: nul(form.title), subtitle: nul(form.subtitle), isActive: form.isActive, startsAt: fromLocal(form.startsAt), endsAt: fromLocal(form.endsAt) };
    const res = await mutate(section ? "PATCH" : "POST", section ? `home-sections/${section.id}` : "home-sections", section ? body : { type, ...body }, { success: "Section saved" });
    setBusy(false);
    if (!res.ok) return setErrors(serverErrors(res.details));
    files.clear();
    const next = { ...form, cfg: config };
    setForm(next);
    setSaved(dirtyKey(next));
    onDone();
  };

  const remove = async () => {
    if (!section) return onDone();
    setBusy(true);
    const res = await mutate("DELETE", `home-sections/${section.id}`, undefined, { success: "Section deleted" });
    setBusy(false);
    if (res.ok) onDone();
  };

  return (
    <section className="min-w-0 rounded-lg border border-line bg-surface p-4 sm:p-5" aria-label={SECTION_LABEL[type]}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {select}
        <h2 className="mr-auto min-w-0 text-body-lg font-semibold break-words">{form.title || SECTION_LABEL[type]}</h2>
        <Badge tone="neutral">{SECTION_LABEL[type]}</Badge>
        {!section ? <Badge tone="warning" dot>New, not saved</Badge> : dirty ? <Badge tone="warning" dot>Unsaved changes</Badge> : <Badge tone={form.isActive ? "success" : "neutral"} dot>{form.isActive ? "Active" : "Inactive"}</Badge>}
        {onMove && <>
          <button type="button" className={icon} onClick={() => onMove(-1)} aria-label={`Move ${SECTION_LABEL[type]} up`}><ArrowUp className="size-4" aria-hidden /></button>
          <button type="button" className={icon} onClick={() => onMove(1)} aria-label={`Move ${SECTION_LABEL[type]} down`}><ArrowDown className="size-4" aria-hidden /></button>
        </>}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <Input label="Title (optional)" value={form.title} onChange={(e) => set({ title: e.target.value })} />
          <Input label="Subtitle (optional)" value={form.subtitle} onChange={(e) => set({ subtitle: e.target.value })} />
          <ScheduleFields startsAt={form.startsAt} endsAt={form.endsAt} error={errors.endsAt} onChange={set} />
          <div className="sm:col-span-2"><Toggle label="Active" checked={form.isActive} onChange={(isActive) => set({ isActive })} /></div>
          <ConfigFields type={type} c={{ cfg: form.cfg, set: (p) => set({ cfg: { ...form.cfg, ...p } }), files: files, lookups, errors }} />
        </div>
        <Preview type={type} cfg={form.cfg} lookups={lookups} />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <Button type="button" size="sm" loading={busy} disabled={!dirty && !!section} onClick={save}>{section ? "Update section" : "Save section"}</Button>
        {!confirm ? <Button type="button" size="sm" variant="ghost" onClick={() => (section ? setConfirm(true) : onDone())}>{section ? "Delete" : "Discard"}</Button> : (
          <span className="flex flex-wrap items-center gap-2" role="alert">
            <Button type="button" size="sm" loading={busy} onClick={remove} className="bg-danger text-on-dark hover:bg-danger">Confirm delete</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
          </span>
        )}
      </div>
    </section>
  );
}
