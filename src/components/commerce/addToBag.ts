import { toast } from "sonner";
import { useCart } from "@/stores/cart";
import { productCopy } from "@/data/copy";
import type { Product, ProductVariant } from "@/types/domain";

const MAX_PER_LINE = 10;

/** Cart line for the bag store. Display-only price; the server re-quotes everything. */
export const cartLineFor = (p: Product, v: ProductVariant) => ({
  variantId: v.id,
  productId: p.id,
  slug: p.slug,
  name: p.name,
  image: v.image ?? p.images[0] ?? { url: "", alt: p.name },
  variantTitle: v.title,
  options: v.options,
  unitPrice: v.price,
  maxQuantity: Math.min(v.stock, MAX_PER_LINE),
});

/** Adds to the bag, opens the drawer and confirms with a toast. Client components only. */
export function addToBag(p: Product, v: ProductVariant, quantity = 1) {
  const cart = useCart.getState();
  cart.add(cartLineFor(p, v), quantity);
  cart.setOpen(true);
  toast.success(`${productCopy.added}: ${p.name}${p.optionNames.length ? ` · ${v.title}` : ""}`);
}
