import { z } from "zod";
import { PAYMENT_PROVIDER } from "@/types/domain";

/** Client sends only ids + quantities; every price is computed by compute_pricing. */
export const CartItemsSchema = z.array(z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10),
})).max(50);

export const QuoteSchema = z.object({
  items: CartItemsSchema,
  couponCode: z.string().trim().max(40).optional().transform((s) => s || undefined),
  shippingMethodId: z.string().uuid().optional(),
  paymentProvider: z.enum(PAYMENT_PROVIDER).optional(),
  /** Destination state name (as in shipping_zones.states); picks the zone when no method is chosen. */
  state: z.string().trim().max(80).optional(),
  /** Guest email so per-user coupon limits apply before sign-in. */
  email: z.string().trim().email().max(200).optional(),
});
export type QuoteInput = z.infer<typeof QuoteSchema>;

export const CouponSchema = QuoteSchema.extend({ couponCode: z.string().trim().min(1).max(40) });
export type CouponInput = z.infer<typeof CouponSchema>;
