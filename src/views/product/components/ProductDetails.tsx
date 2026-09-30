import { Check } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { productCopy as c } from "@/data/copy";
import { pdpCopy } from "@/data/storefront";
import type { Product } from "@/types/domain";

const dims = (d: NonNullable<Product["dimensions"]>) =>
  [d.lengthMm, d.widthMm, d.heightMm].every((n) => n) ? `${d.lengthMm} × ${d.widthMm} × ${d.heightMm} mm` : null;
const weight = (g: number) => (g >= 1000 ? `${(g / 1000).toLocaleString("en-IN", { maximumFractionDigits: 2 })} kg` : `${g} g`);

/** Highlights, description, grouped specifications and the general details table. */
export function ProductDetails({ product: p }: { product: Product }) {
  const general = [
    p.brand && [pdpCopy.brand, p.brand],
    p.weightGrams && [pdpCopy.weight, weight(p.weightGrams)],
    p.dimensions && dims(p.dimensions) && [pdpCopy.dimensions, dims(p.dimensions)],
    p.warranty && [c.warranty, p.warranty],
    p.countryOfOrigin && [c.countryOfOrigin, p.countryOfOrigin],
    [c.returns, p.returnable && p.returnWindowDays ? c.returnable(p.returnWindowDays) : c.notReturnable],
  ].filter((r): r is [string, string] => Array.isArray(r));

  const groups = new Map<string, { label: string; value: string }[]>();
  for (const s of p.specifications) {
    const g = s.group || pdpCopy.general;
    groups.set(g, [...(groups.get(g) ?? []), s]);
  }
  const row = "grid grid-cols-[minmax(8rem,2fr)_3fr] gap-4 py-3 text-body";

  return (
    <div className="grid gap-14 lg:grid-cols-12 lg:gap-12">
      <div className="space-y-10 lg:col-span-6">
        {p.highlights.length > 0 && (
          <Reveal>
            <h2 className="t-h2">{c.highlights}</h2>
            <ul className="mt-4 space-y-2.5">
              {p.highlights.map((h) => (
                <li key={h} className="flex gap-3 text-body-lg"><Check className="mt-1 size-4 shrink-0 text-accent-deep" aria-hidden />{h}</li>
              ))}
            </ul>
          </Reveal>
        )}
        {p.description && (
          <Reveal>
            <h2 className="t-h2">{c.description}</h2>
            <div className="mt-4 max-w-prose space-y-4 text-body-lg leading-relaxed text-ink-soft">
              {p.description.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
            </div>
          </Reveal>
        )}
      </div>
      <Reveal className="space-y-10 lg:col-span-6">
        {groups.size > 0 && (
          <section>
            <h2 className="t-h2">{c.specifications}</h2>
            {[...groups].map(([group, specs]) => (
              <div key={group} className="mt-5">
                {groups.size > 1 && <h3 className="t-overline text-ink-soft">{group}</h3>}
                <dl className="mt-1 divide-y divide-line-soft border-y border-line-soft">
                  {specs.map((s) => <div key={s.label} className={row}><dt className="text-ink-soft">{s.label}</dt><dd>{s.value}</dd></div>)}
                </dl>
              </div>
            ))}
          </section>
        )}
        <section>
          <h2 className="t-h2">{pdpCopy.details}</h2>
          <dl className="mt-4 divide-y divide-line-soft border-y border-line-soft">
            {general.map(([k, v]) => <div key={k} className={row}><dt className="text-ink-soft">{k}</dt><dd>{v}</dd></div>)}
          </dl>
        </section>
      </Reveal>
    </div>
  );
}
