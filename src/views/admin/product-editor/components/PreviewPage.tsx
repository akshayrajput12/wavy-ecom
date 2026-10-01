import { useState } from "react";
import { clsx } from "clsx";
import type { EditorForm } from "./form";
import { PreviewImage, Stars } from "./PreviewCard";
import type { PreviewModel } from "./previewData";

/** Condensed storefront product page. */
export function PreviewPage({ m, f }: { m: PreviewModel; f: EditorForm }) {
  const [sel, setSel] = useState(0);
  const cover = m.images[Math.min(sel, Math.max(0, m.images.length - 1))];
  return (
    <div className="grid gap-4 rounded-lg border border-line bg-surface p-4">
      <div className="relative aspect-square overflow-hidden rounded-md bg-surface-warm"><PreviewImage url={cover?.url} alt={cover?.alt ?? ""} sizes="360px" /></div>
      {m.images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto" aria-label="Gallery thumbnails">
          {m.images.map((im, i) => (
            <li key={im.url}>
              <button type="button" aria-label={`Show image ${i + 1}`} aria-current={i === sel} onClick={() => setSel(i)}
                className={clsx("relative block size-14 overflow-hidden rounded-sm border", i === sel ? "border-ink" : "border-line")}>
                <PreviewImage url={im.url} alt="" sizes="56px" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-1">
        {f.brand && <p className="t-overline text-ink-soft">{f.brand}</p>}
        <h3 className="t-h3">{m.title}</h3>
        <Stars avg={m.rating.avg} count={m.rating.count} />
        <p className="flex items-baseline gap-2 text-body-lg">
          <span className="font-semibold">{m.priceText}</span>
          {m.compareText && <s className="text-meta text-ink-soft">{m.compareText}</s>}
        </p>
        {f.shortDescription && <p className="text-meta text-ink-soft">{f.shortDescription}</p>}
      </div>
      {m.options.map((o) => (
        <div key={o.name}>
          <p className="mb-1 text-meta font-medium">{o.name}</p>
          <ul className="flex flex-wrap gap-1.5">{o.values.map((v, i) => (
            <li key={v} className={clsx("rounded-pill border px-3 py-1 text-meta", i === 0 ? "border-ink bg-ink text-on-dark" : "border-line")}>{v}</li>
          ))}</ul>
        </div>
      ))}
      {m.highlights.length > 0 && <ul className="list-disc pl-5 text-meta">{m.highlights.map((h) => <li key={h}>{h}</li>)}</ul>}
      {m.specs.length > 0 && (
        <dl className="grid gap-1 border-t border-line pt-3 text-meta">
          {m.specs.map((s, i) => <div key={i} className="grid grid-cols-2 gap-2"><dt className="text-ink-soft">{s.label}</dt><dd>{s.value}</dd></div>)}
        </dl>
      )}
    </div>
  );
}
