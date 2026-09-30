import {
  bundleOffer, coupons, FREE_SHIPPING_THRESHOLD, GST_RATE, type PaymentMethod, type ShippingMethod,
} from "@/data/checkout";
import type { CartLine } from "@/types/domain";

/**
 * Display-only estimate (paise). The server recomputes everything before charging;
 * this only keeps the summary honest while the customer fills the form.
 */
export function estimateTotals(
  lines: Pick<CartLine, "unitPrice" | "quantity">[],
  opts: { shipping?: ShippingMethod; payment?: PaymentMethod; coupon?: string } = {},
) {
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const items = lines.reduce((s, l) => s + l.quantity, 0);
  const bundleDiscount = items >= bundleOffer.minItems ? Math.round((subtotal * bundleOffer.percentOff) / 100) : 0;
  const coupon = opts.coupon ? coupons[opts.coupon.toUpperCase()] : undefined;
  const couponDiscount = coupon ? Math.round(((subtotal - bundleDiscount) * coupon.percentOff) / 100) : 0;
  const discount = bundleDiscount + couponDiscount;
  const net = subtotal - discount;
  const s = opts.shipping;
  const shipping = !s ? 0 : s.freeAboveThreshold && net >= FREE_SHIPPING_THRESHOLD ? 0 : s.cost;
  const codFee = opts.payment?.fee ?? 0;
  const total = net + shipping + codFee;
  const tax = Math.round(total - total / (1 + GST_RATE));
  return { subtotal, items, bundleDiscount, couponDiscount, discount, shipping, codFee, tax, total, couponValid: !!coupon };
}
export type Totals = ReturnType<typeof estimateTotals>;
