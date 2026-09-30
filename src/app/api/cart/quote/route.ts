import { getSession } from "@/backend/_core/auth";
import { ok, parse, route } from "@/backend/_core/http";
import { QuoteSchema } from "@/backend/pricing/schema";
import { quoteCart } from "@/backend/pricing/service";

/** POST /api/cart/quote { items[{variantId,quantity}], couponCode?, shippingMethodId?, paymentProvider?, state?, email? } -> CartQuote */
export const POST = route("pricing", async ({ req }) => {
  const input = await parse(req, QuoteSchema);
  return ok(await quoteCart(input, await getSession()), { headers: { "cache-control": "no-store" } });
});
