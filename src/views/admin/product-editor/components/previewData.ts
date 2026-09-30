import { formatPrice } from "@/lib/format";
import { axes, splitList, type EditorForm } from "./form";

export interface PreviewRating { avg: number; count: number }

/** Derived values both preview panels share, computed from live form state. */
export function previewData(f: EditorForm, real: PreviewRating) {
  const live = f.variants.filter((v) => !v.disabled);
  const prices = live.map((v) => Number(v.price)).filter((n) => n > 0);
  const price = prices.length ? Math.min(...prices) : null;
  const compares = live.map((v) => Number(v.compareAt)).filter((n) => n > 0);
  const compare = compares.length ? Math.min(...compares) : null;
  const ro = f.ratingOverride.trim() === "" ? null : Number(f.ratingOverride);
  const co = f.reviewCountOverride.trim() === "" ? null : Number(f.reviewCountOverride);
  const money = (rs: number | null) => (rs == null ? "Add a price" : formatPrice(Math.round(rs * 100)));
  return {
    title: f.name.trim() || "Untitled product",
    images: f.media.map((m) => ({ url: m.url, alt: m.alt })),
    priceText: money(price),
    compareText: compare && price && compare > price ? money(compare) : null,
    off: compare && price && compare > price ? Math.round((1 - price / compare) * 100) : 0,
    rating: { avg: ro ?? real.avg, count: co ?? real.count },
    badges: splitList(f.badges),
    highlights: f.highlights.split("\n").map((x) => x.trim()).filter(Boolean),
    options: axes(f.optionRows).names.map((name, i) => ({ name, values: axes(f.optionRows).values[i] })),
    specs: f.specs.filter((x) => x.label && x.value),
  };
}
export type PreviewModel = ReturnType<typeof previewData>;
