import { productCopy } from "@/data/copy";
import type { ProductVariant } from "@/types/domain";

const LOW_STOCK = 5;

/** Stock in words (never colour alone). */
export function StockNote({ variant }: { variant?: ProductVariant }) {
  if (!variant || variant.stock <= 0 || variant.status !== "active") {
    return <p className="text-meta font-medium text-danger">{productCopy.soldOut}</p>;
  }
  if (variant.stock <= LOW_STOCK) return <p className="text-meta font-medium text-warning">{productCopy.fewLeft(variant.stock)}</p>;
  return <p className="text-meta font-medium text-success">✓ {productCopy.inStock}</p>;
}
