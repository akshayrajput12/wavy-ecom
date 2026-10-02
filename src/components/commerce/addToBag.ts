import { toast } from "sonner";
import { toCartLine, useCart } from "@/stores/cart";
import { productCopy } from "@/data/copy";
import type { Product, ProductVariant } from "@/types/domain";

/** Adds to the bag (which opens the drawer) and confirms with a toast. Display-only price; the server re-quotes. */
export function addToBag(p: Product, v: ProductVariant, quantity = 1) {
  useCart.getState().add(toCartLine(p, v), quantity);
  toast.success(`${productCopy.added}: ${p.name}${p.optionNames.length ? ` · ${v.title}` : ""}`);
}
