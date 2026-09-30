import type { CartLine } from "../../../types/domain";

export interface CartRules {
  bundleIds: readonly string[]; // product ids eligible for the "any N for ₹X" offer
  bundleSize: number;
  bundlePrice: number;
  freeThreshold: number;
  shippingFee: number;
}

export interface CartEstimate {
  count: number;
  subtotal: number;
  bundleDiscount: number;
  shipping: number;
  total: number;
  /** Eligible items still needed to complete the next bundle (0 = none started or all complete). */
  itemsForBundle: number;
  freeShippingRemaining: number;
}

/**
 * Display-only estimate (paise). The server recomputes totals at checkout.
 * Bundles are filled from the most expensive eligible units first (best for the customer).
 */
export function estimateCart(lines: CartLine[], r: CartRules): CartEstimate {
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const subtotal = lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0);

  const units = lines
    .filter((l) => r.bundleIds.includes(l.productId))
    .flatMap((l) => Array<number>(l.quantity).fill(l.unitPrice))
    .sort((a, b) => b - a);
  let bundleDiscount = 0;
  for (let i = 0; i + r.bundleSize <= units.length; i += r.bundleSize) {
    const group = units.slice(i, i + r.bundleSize).reduce((a, b) => a + b, 0);
    bundleDiscount += Math.max(0, group - r.bundlePrice);
  }
  const rem = units.length % r.bundleSize;
  const itemsForBundle = rem === 0 ? 0 : r.bundleSize - rem;

  const afterDiscount = subtotal - bundleDiscount;
  const shipping = count === 0 || afterDiscount >= r.freeThreshold ? 0 : r.shippingFee;
  return {
    count, subtotal, bundleDiscount, shipping, total: afterDiscount + shipping, itemsForBundle,
    freeShippingRemaining: count === 0 ? 0 : Math.max(0, r.freeThreshold - afterDiscount),
  };
}
