import { clsx } from "clsx";
import { productCopy } from "@/data/copy";
import type { ProductVariant } from "@/types/domain";

const LOW_STOCK = 5;

/** Stock in words with a status dot (never colour alone). */
export function StockNote({ variant, className }: { variant?: ProductVariant; className?: string }) {
  const [tone, text] = !variant || variant.stock <= 0 || variant.status !== "active"
    ? ["text-danger", productCopy.soldOut]
    : variant.stock <= LOW_STOCK
      ? ["text-warning", productCopy.fewLeft(variant.stock)]
      : ["text-success", productCopy.inStock];
  return (
    <p className={clsx("inline-flex items-center gap-2 text-meta font-medium", tone, className)}>
      <span className="size-1.5 rounded-pill bg-current" aria-hidden />
      {text}
    </p>
  );
}
