import { clsx } from "clsx";
import type { EditorForm } from "./form";
import { PreviewCard } from "./PreviewCard";
import { PreviewPage } from "./PreviewPage";
import { previewData, type PreviewRating } from "./previewData";

/** Sticky live preview (desktop column, or a tab on mobile). Renders straight from form state. */
export function Preview({ f, real, className }: { f: EditorForm; real: PreviewRating; className?: string }) {
  const m = previewData(f, real);
  return (
    <div className={clsx("grid gap-6", className)}>
      <div><p className="t-overline mb-2 text-ink-soft">Listing card</p><PreviewCard m={m} brand={f.brand} /></div>
      <div><p className="t-overline mb-2 text-ink-soft">Product page</p><PreviewPage m={m} f={f} /></div>
    </div>
  );
}
