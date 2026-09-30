"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { Ruler } from "lucide-react";
import { Modal } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { sizeChart, sizeFinderCopy as c } from "@/data/content";
import { recommendSize, type FitPreference, type SizeResult } from "../sizeFinder";

/** Screen 09 — measurements in, recommended size + reasoning out. */
export function SizeFinder({ productFit, isSoldOut, onUse }: { productFit?: string; isSoldOut: (size: string) => boolean; onUse: (size: string) => void }) {
  const [open, setOpen] = useState(false);
  const [fit, setFit] = useState<FitPreference>("regular");
  const [result, setResult] = useState<SizeResult | null>();
  const [error, setError] = useState(false);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = recommendSize({ heightCm: Number(f.get("height")), chestCm: Number(f.get("chest")), waistCm: Number(f.get("waist")), fit }, sizeChart, productFit);
    setError(!r);
    setResult(r);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-11 items-center gap-1.5 text-meta font-medium underline underline-offset-4 hover:text-accent-deep">
        <Ruler className="size-4" aria-hidden /> {c.title}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={c.title}>
        <p className="text-body text-ink-soft">{c.intro}</p>
        <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
          <div className="grid grid-cols-3 gap-3">
            <Input label={c.height} name="height" type="number" inputMode="numeric" min={130} max={220} placeholder="175" required />
            <Input label={c.chest} name="chest" type="number" inputMode="numeric" min={60} max={160} placeholder="100" required />
            <Input label={c.waist} name="waist" type="number" inputMode="numeric" min={50} max={150} placeholder="84" required />
          </div>
          <fieldset>
            <legend className="text-meta font-medium">{c.fit}</legend>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {c.fits.map((o) => (
                <label key={o.id} className={clsx("flex h-11 cursor-pointer items-center justify-center rounded-sm border text-meta font-medium has-focus-visible:outline-2", fit === o.id ? "border-ink bg-ink text-on-dark" : "border-line bg-surface hover:border-ink")}>
                  <input type="radio" name="fit" value={o.id} checked={fit === o.id} onChange={() => setFit(o.id as FitPreference)} className="sr-only" />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>
          <p className="text-micro text-ink-soft">{c.howTo}</p>
          {error && <p role="alert" className="text-meta text-danger">⚠ {c.error}</p>}
          <Button type="submit" variant="secondary" full>{c.submit}</Button>
        </form>

        {result && (
          <div className="mt-6 rounded-md bg-surface-warm p-5" aria-live="polite">
            <p className="t-overline text-ink-soft">{c.recommended}</p>
            <p className="mt-1 font-serif text-hero leading-none">{result.size}</p>
            <ul className="mt-4 list-disc space-y-1.5 pl-4 text-body text-ink-soft">
              {result.reasons.map((r) => <li key={r}>{r}</li>)}
            </ul>
            {isSoldOut(result.size) && <p className="mt-3 text-meta font-medium text-warning">{c.unavailable}</p>}
            <Button className="mt-5" full disabled={isSoldOut(result.size)} onClick={() => { onUse(result.size); setOpen(false); }}>
              {c.use(result.size)}
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
