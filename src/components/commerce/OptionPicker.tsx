"use client";

import { clsx } from "clsx";
import { productCopy } from "@/data/copy";
import type { Product } from "@/types/domain";
import { choicesFor, isColorAxis, selectOption, type Selection } from "./variantSelect";

/**
 * Generic option selectors driven by `product.optionNames`: colour swatches (when the value has a colorHex),
 * pills otherwise. Unavailable values stay selectable-looking but disabled, with the reason in text.
 */
export function OptionPicker({ product: p, selection, onChange, idPrefix }: {
  product: Product; selection: Selection; onChange: (s: Selection) => void; idPrefix: string;
}) {
  return (
    <div className="space-y-5">
      {p.optionNames.map((name) => {
        const choices = choicesFor(p, name, selection);
        const swatch = isColorAxis(name) && choices.some((c) => c.colorHex);
        return (
          <fieldset key={name}>
            <legend className="text-meta">
              <span className="font-semibold text-ink">{name}:</span>{" "}
              <span className="text-ink-soft">{selection[name] ?? productCopy.select(name)}</span>
            </legend>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {choices.map((c) => {
                const on = selection[name] === c.value;
                const input = (
                  <input
                    type="radio" name={`${idPrefix}-${name}`} value={c.value} checked={on} disabled={!c.available}
                    onChange={() => onChange(selectOption(p, selection, name, c.value))} className="sr-only"
                  />
                );
                const label = <span className="sr-only">{c.value}{!c.available && ` (${productCopy.soldOut})`}</span>;
                return swatch ? (
                  <label key={c.value} title={c.value} className={clsx(
                    "relative grid size-11 place-items-center rounded-pill border-2 transition-colors duration-(--dur-fast) has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus",
                    on ? "border-ink" : "border-transparent hover:border-line",
                    c.available ? "cursor-pointer" : "cursor-not-allowed",
                  )}>
                    {input}{label}
                    <span className={clsx("size-8 rounded-pill border border-ink/15", !c.available && "opacity-40")} style={{ backgroundColor: c.colorHex }} aria-hidden />
                    {!c.available && <span className="absolute h-px w-9 rotate-45 bg-ink-soft" aria-hidden />}
                  </label>
                ) : (
                  <label key={c.value} className={clsx(
                    "relative inline-flex min-h-11 min-w-11 items-center justify-center overflow-hidden rounded-pill border px-4 text-meta font-medium transition-colors duration-(--dur-fast)",
                    "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus",
                    !c.available ? "cursor-not-allowed border-line-soft text-ink-muted line-through" : on ? "cursor-pointer border-ink bg-ink text-on-dark" : "cursor-pointer border-line bg-surface hover:border-ink",
                  )}>
                    {input}
                    <span aria-hidden>{c.value}</span>{label}
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
