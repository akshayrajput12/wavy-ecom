/** compute_pricing jsonb -> CartQuote (pure; covered by quote.test.ts). */
import type { AppliedDiscount, CartQuote, OfferNudge, OptionValue, QuoteCoupon, QuoteError, QuoteLine } from "@/types/domain";

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const int = (v: unknown): number => (typeof v === "number" ? Math.round(v) : Number.parseInt(String(v ?? 0), 10) || 0);
const str = (v: unknown): string | undefined => (typeof v === "string" && v ? v : undefined);

export const toOptions = (v: unknown): OptionValue[] =>
  arr(v).flatMap((o) => { const x = obj(o); return str(x.name) && str(x.value) ? [{ name: x.name as string, value: x.value as string }] : []; });

export function normalizeQuote(raw: unknown): CartQuote {
  const q = obj(raw);
  const lines: QuoteLine[] = arr(q.lines).map((l) => {
    const x = obj(l);
    return {
      variantId: String(x.variantId), productId: String(x.productId), categoryId: String(x.categoryId ?? ""),
      sku: String(x.sku ?? ""), name: String(x.name ?? ""), brand: str(x.brand), slug: String(x.slug ?? ""),
      variantTitle: String(x.variantTitle ?? ""), options: toOptions(x.options), image: str(x.image),
      unitPrice: int(x.unitPrice), compareAtPrice: x.compareAtPrice == null ? undefined : int(x.compareAtPrice),
      quantity: int(x.quantity), maxQuantity: int(x.maxQuantity), lineSubtotal: int(x.lineSubtotal),
      discount: int(x.discount), lineTotal: int(x.lineTotal), hsnCode: str(x.hsnCode), returnWindowDays: int(x.returnWindowDays),
    };
  });
  const errors: QuoteError[] = arr(q.errors).map((e) => {
    const x = obj(e);
    return {
      code: String(x.code ?? "unknown"), variantId: str(x.variantId),
      available: x.available == null ? undefined : int(x.available), provider: str(x.provider), max: x.max == null ? undefined : int(x.max),
    };
  });
  const c = q.coupon ? obj(q.coupon) : null;
  const coupon: QuoteCoupon | null = c && {
    id: str(c.id) ?? null, code: String(c.code ?? ""), type: (str(c.type) as QuoteCoupon["type"]) ?? null,
    valid: c.valid === true, error: str(c.error) ?? null, discount: int(c.discount), freeShipping: c.freeShipping === true,
  };
  const sm = q.shippingMethod ? obj(q.shippingMethod) : null;
  return {
    valid: q.valid === true, errors, currency: String(q.currency ?? "INR"), lines,
    subtotal: int(q.subtotal), offerDiscount: int(q.offerDiscount), couponDiscount: int(q.couponDiscount), discount: int(q.discount),
    shipping: int(q.shipping), codFee: int(q.codFee), tax: int(q.tax), taxRate: Number(q.taxRate ?? 0), taxInclusive: q.taxInclusive === true,
    total: int(q.total), appliedCoupon: str(q.appliedCoupon), coupon,
    appliedDiscounts: arr(q.appliedDiscounts).map((d) => {
      const x = obj(d);
      return {
        kind: x.kind === "coupon" ? "coupon" : "offer", id: String(x.id), name: str(x.name), code: str(x.code), type: str(x.type),
        amount: int(x.amount), applications: x.applications == null ? undefined : int(x.applications),
        freeShipping: x.freeShipping === true || undefined,
      } satisfies AppliedDiscount;
    }),
    offerNudges: arr(q.offerNudges).map((n): OfferNudge => {
      const x = obj(n);
      return { offerId: String(x.offerId), message: String(x.message ?? ""), itemsNeeded: int(x.itemsNeeded) };
    }),
    shippingMethod: sm && {
      id: String(sm.id), code: String(sm.code ?? ""), name: String(sm.name ?? ""), rate: int(sm.rate),
      minDays: int(sm.minDays), maxDays: int(sm.maxDays),
    },
  };
}
