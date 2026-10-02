"use client";

import { ArrowDown, ArrowUp, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/admin/Fields";
import { Input } from "@/components/ui/Input";
import { CtaFields, Err, ImagePick, Txt, obj, str, type Cfg, type Ctx } from "./shared";

const icon = "grid size-11 place-items-center rounded-pill text-ink-soft hover:bg-surface-warm disabled:opacity-30";

export function HeroFields({ c }: { c: Ctx }) {
  const slides = (Array.isArray(c.cfg.slides) ? c.cfg.slides : []) as Cfg[];
  const put = (next: Cfg[]) => c.set({ slides: next });
  const patch = (i: number, p: Cfg) => put(slides.map((s, j) => (j === i ? { ...s, ...p } : s)));
  const move = (i: number, d: -1 | 1) => { const n = [...slides]; [n[i], n[i + d]] = [n[i + d], n[i]]; put(n); };
  const err = (i: number, k: string) => c.errors[`config.slides.${i}.${k}`];
  return (
    <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
      <Txt c={c} k="autoplayMs" label="Autoplay (ms, 2000 to 30000)" type="number" />
      {slides.map((s, i) => (
        <fieldset key={i} className="grid min-w-0 gap-3 rounded-md border border-line p-3 sm:col-span-2 sm:grid-cols-2 sm:p-4">
          <legend className="px-1 text-meta font-medium">Slide {i + 1}</legend>
          <ImagePick files={c.files} url={str(s, "image")} alt={str(s, "imageAlt")} label="Slide image" error={err(i, "image") ?? err(i, "imageAlt")} onChange={(image, imageAlt) => patch(i, { image, imageAlt })} />
          <Input label="Eyebrow" value={str(s, "eyebrow")} onChange={(e) => patch(i, { eyebrow: e.target.value })} />
          <Input label="Heading" value={str(s, "heading")} onChange={(e) => patch(i, { heading: e.target.value })} error={err(i, "heading")} />
          <Input label="Body" value={str(s, "body")} onChange={(e) => patch(i, { body: e.target.value })} />
          <Select label="Text theme" value={str(s, "theme")} onChange={(e) => patch(i, { theme: e.target.value })}>
            <option value="">Default</option><option value="light">Light</option><option value="dark">Dark</option>
          </Select>
          <CtaFields title="Primary button" value={obj(s, "cta")} onChange={(cta) => patch(i, { cta })} error={err(i, "cta.label")} hrefError={err(i, "cta.href")} />
          <div className="flex gap-1 sm:col-span-2">
            <button type="button" className={icon} disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move slide ${i + 1} up`}><ArrowUp className="size-4" aria-hidden /></button>
            <button type="button" className={icon} disabled={i === slides.length - 1} onClick={() => move(i, 1)} aria-label={`Move slide ${i + 1} down`}><ArrowDown className="size-4" aria-hidden /></button>
            <button type="button" className={icon} disabled={slides.length === 1} onClick={() => put(slides.filter((_, j) => j !== i))} aria-label={`Remove slide ${i + 1}`}><X className="size-4" aria-hidden /></button>
          </div>
        </fieldset>
      ))}
      <Err msg={c.errors["config.slides"]} />
      <div className="sm:col-span-2"><Button type="button" size="sm" variant="ghost" disabled={slides.length >= 10} onClick={() => put([...slides, {}])}>Add slide</Button></div>
    </div>
  );
}
