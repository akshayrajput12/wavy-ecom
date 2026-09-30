"use client";

import { Trash2 } from "lucide-react";
import { Textarea, Toggle } from "@/components/admin/Fields";
import { FormSection } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { EditorForm, SetForm } from "./form";

export function SpecsSection({ f, set }: { f: EditorForm; set: SetForm }) {
  const upd = (i: number, k: "group" | "label" | "value", v: string) => set({ specs: f.specs.map((r, j) => (j === i ? { ...r, [k]: v } : r)) });
  return (
    <FormSection title="Specifications" description="Grouped label and value rows shown on the product page.">
      <div className="grid gap-3 sm:col-span-2">
        {f.specs.map((r, i) => (
          <div key={i} className="grid items-end gap-3 sm:grid-cols-[160px_1fr_1fr_auto]">
            <Input label="Group" value={r.group} onChange={(e) => upd(i, "group", e.target.value)} />
            <Input label="Label" value={r.label} onChange={(e) => upd(i, "label", e.target.value)} />
            <Input label="Value" value={r.value} onChange={(e) => upd(i, "value", e.target.value)} />
            <button type="button" aria-label={`Remove specification ${i + 1}`} onClick={() => set({ specs: f.specs.filter((_, j) => j !== i) })}
              className="grid size-11 place-items-center rounded-sm hover:bg-surface-warm"><Trash2 className="size-4" /></button>
          </div>
        ))}
        <Button type="button" size="sm" variant="secondary" className="justify-self-start" onClick={() => set({ specs: [...f.specs, { group: f.specs.at(-1)?.group ?? "", label: "", value: "" }] })}>Add row</Button>
      </div>
    </FormSection>
  );
}

export function ShippingSection({ f, set }: { f: EditorForm; set: SetForm }) {
  const n = (k: "weightGrams" | "lengthMm" | "widthMm" | "heightMm" | "returnWindowDays", label: string, disabled = false) => (
    <Input label={label} type="number" min="0" disabled={disabled} value={f[k]} onChange={(e) => set({ [k]: e.target.value })} />
  );
  return (
    <FormSection title="Shipping & compliance" description="Used for courier rates, invoices and the returns policy.">
      {n("weightGrams", "Weight (g)")}
      <Input label="HSN code" value={f.hsnCode} hint="4 to 8 digits" onChange={(e) => set({ hsnCode: e.target.value })} />
      <div className="grid grid-cols-3 gap-3 sm:col-span-2">{n("lengthMm", "Length (mm)")}{n("widthMm", "Width (mm)")}{n("heightMm", "Height (mm)")}</div>
      <Input label="Country of origin" value={f.countryOfOrigin} onChange={(e) => set({ countryOfOrigin: e.target.value })} />
      <Input label="Warranty" value={f.warranty} onChange={(e) => set({ warranty: e.target.value })} />
      <Toggle label="Returnable" checked={f.returnable} onChange={(v) => set({ returnable: v })} />
      {n("returnWindowDays", "Return window (days)", !f.returnable)}
    </FormSection>
  );
}

const cut = (t: string, n: number) => (t.length > n ? `${t.slice(0, n - 1)}...` : t);

export function SeoSection({ f, set }: { f: EditorForm; set: SetForm }) {
  const title = f.seoTitle || f.name || "Untitled product";
  return (
    <FormSection title="Search appearance" description="How this product shows up on Google.">
      <div className="grid gap-4">
        <Input label="SEO title" value={f.seoTitle} hint={`${f.seoTitle.length}/70 characters`} maxLength={70} onChange={(e) => set({ seoTitle: e.target.value })} />
        <Textarea label="Meta description" value={f.seoDescription} hint={`${f.seoDescription.length}/170 characters`} maxLength={170} onChange={(e) => set({ seoDescription: e.target.value })} />
        <Toggle label="Hide from search engines" checked={f.noindex} onChange={(v) => set({ noindex: v })} />
      </div>
      <section aria-label="Google search preview" className="self-start rounded-md border border-line p-4">
        <p className="t-overline mb-2 text-ink-soft">Search preview</p>
        <p className="truncate text-meta text-ink-soft">/products/{f.slug || "..."}</p>
        <p className="mt-0.5 text-body-lg text-info">{cut(title, 60)}</p>
        <p className="mt-1 text-meta text-ink-soft">{cut(f.seoDescription || f.shortDescription || "Add a meta description so search engines do not pick random page text.", 160)}</p>
      </section>
    </FormSection>
  );
}

export function RatingsSection({ f, set, canRate }: { f: EditorForm; set: SetForm; canRate: boolean }) {
  return (
    <FormSection title="Ratings" description="Override the shown rating and review count. Leave empty to use real reviews.">
      <Input label="Rating override (0 to 5)" type="number" min="0" max="5" step="0.1" disabled={!canRate} value={f.ratingOverride} onChange={(e) => set({ ratingOverride: e.target.value })}
        hint={canRate ? undefined : "Needs the review moderation permission"} />
      <Input label="Review count override" type="number" min="0" disabled={!canRate} value={f.reviewCountOverride} onChange={(e) => set({ reviewCountOverride: e.target.value })} />
    </FormSection>
  );
}
