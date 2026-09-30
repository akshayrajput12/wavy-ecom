import "server-only";
import type { Session } from "@/backend/_core/auth";
import { must, serviceDb } from "@/backend/_core/db";
import type { CartQuote, QuoteCoupon } from "@/types/domain";
import { normalizeQuote } from "./quote";
import type { CouponInput, QuoteInput } from "./schema";

/**
 * Server-authoritative totals for a bag (compute_pricing, service role). Includes stock/line errors,
 * offer discounts + nudges, coupon result, shipping, COD fee and tax. Never trusts client prices.
 */
export async function quoteCart(input: QuoteInput, session: Session | null): Promise<CartQuote> {
  const db = serviceDb();
  const raw = must(await db.rpc("compute_pricing", {
    p_items: input.items,
    p_coupon_code: input.couponCode ?? null,
    p_user_id: session?.userId ?? null,
    p_email: session?.email ?? input.email ?? null,
    p_shipping_method_id: input.shippingMethodId ?? null,
    p_payment_provider: input.paymentProvider ?? null,
    p_state: input.state ?? null,
  }), "price the cart");
  return normalizeQuote(raw);
}

/** Validates a coupon against the bag; `coupon.error` is a stable code (coupon_expired, coupon_min_order_not_met, ...). */
export async function validateCoupon(input: CouponInput, session: Session | null): Promise<{ coupon: QuoteCoupon; quote: CartQuote }> {
  const quote = await quoteCart(input, session);
  const coupon = quote.coupon ?? { id: null, code: input.couponCode.toUpperCase(), type: null, valid: false, error: "coupon_not_found", discount: 0, freeShipping: false };
  return { coupon, quote };
}
