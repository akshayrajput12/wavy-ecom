import { Check } from "lucide-react";
import { Accordion } from "@/components/ui/Controls";
import { productCopy as c } from "@/data/copy";
import { pdpCopy } from "@/data/storefront";
import type { Product } from "@/types/domain";

const dims = (d: NonNullable<Product["dimensions"]>) =>
  [d.lengthMm, d.widthMm, d.heightMm].every((n) => n) ? `${d.lengthMm} × ${d.widthMm} × ${d.heightMm} mm` : null;
const weight = (g: number) => (g >= 1000 ? `${(g / 1000).toLocaleString("en-IN", { maximumFractionDigits: 2 })} kg` : `${g} g`);
const row = "grid grid-cols-[minmax(7rem,2fr)_3fr] gap-4 py-2.5 text-meta";

function Rows({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className="divide-y divide-line-soft">
      {rows.map((r) => <div key={r.label} className={row}><dt className="text-ink-soft">{r.label}</dt><dd className="text-ink">{r.value}</dd></div>)}
    </dl>
  );
}

/** Accordion details under the buy box: description, highlights, grouped specifications, general details. */
export function ProductDetails({ product: p }: { product: Product }) {
  const general = [
    p.brand && [pdpCopy.brand, p.brand],
    p.weightGrams && [pdpCopy.weight, weight(p.weightGrams)],
    p.dimensions && dims(p.dimensions) && [pdpCopy.dimensions, dims(p.dimensions)],
    p.warranty && [c.warranty, p.warranty],
    p.countryOfOrigin && [c.countryOfOrigin, p.countryOfOrigin],
    [c.returns, p.returnable && p.returnWindowDays ? c.returnable(p.returnWindowDays) : c.notReturnable],
  ].filter((r): r is [string, string] => Array.isArray(r)).map(([label, value]) => ({ label, value }));

  const groups = new Map<string, { label: string; value: string }[]>();
  for (const s of p.specifications) {
    const g = s.group || pdpCopy.general;
    groups.set(g, [...(groups.get(g) ?? []), s]);
  }

  return (
    <div className="mt-8 border-t border-line">
      {p.description && (
        <Accordion title={c.description} defaultOpen>
          <div className="max-w-prose space-y-3 leading-relaxed">
            {p.description.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
          </div>
        </Accordion>
      )}
      {p.highlights.length > 0 && (
        <Accordion title={c.highlights}>
          <ul className="space-y-2">
            {p.highlights.map((h) => <li key={h} className="flex gap-3"><Check className="mt-1 size-4 shrink-0 text-ink" aria-hidden />{h}</li>)}
          </ul>
        </Accordion>
      )}
      {groups.size > 0 && (
        <Accordion title={c.specifications}>
          {[...groups].map(([group, specs]) => (
            <div key={group} className="not-first:mt-4">
              {groups.size > 1 && <h3 className="t-overline mb-1">{group}</h3>}
              <Rows rows={specs} />
            </div>
          ))}
        </Accordion>
      )}
      <Accordion title={pdpCopy.details}><Rows rows={general} /></Accordion>
    </div>
  );
}
