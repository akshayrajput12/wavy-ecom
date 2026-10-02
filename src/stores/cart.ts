import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { cartCopy, pricingErrors } from "@/data/copy";
import type { CartLine, CartQuote, PaymentProvider, Product, ProductVariant } from "@/types/domain";
import { api } from "./http";

/** Server limits (pricing/schema.ts): 1..10 per line, 50 lines. */
export const MAX_PER_LINE = 10;
const MAX_LINES = 50;

export type AddToCart = Omit<CartLine, "id" | "quantity">;

interface CartState {
  lines: CartLine[];
  coupon?: string;
  open: boolean;
  /** Adds (or tops up) a line and opens the bag drawer. */
  add: (item: AddToCart, quantity?: number) => void;
  update: (variantId: string, quantity: number) => void;
  /** Returns what was removed so the caller can offer undo via `restore`. */
  remove: (variantId: string) => { line: CartLine; index: number } | undefined;
  restore: (line: CartLine, index: number) => void;
  clear: () => void;
  setCoupon: (code?: string) => void;
  setOpen: (open: boolean) => void;
}

const cap = (n: number, max: number) => Math.max(1, Math.min(n, max, MAX_PER_LINE));

/**
 * Bag UI state, persisted to localStorage. Prices on lines are DISPLAY-ONLY snapshots from the PDP:
 * totals, stock and discounts always come from POST /api/cart/quote (`useCartQuote`).
 * `skipHydration` avoids SSR mismatches; `useCartHydrated()` rehydrates once on the client.
 */
export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      open: false,
      add: (item, quantity = 1) =>
        set((s) => {
          const existing = s.lines.find((l) => l.variantId === item.variantId);
          if (existing) {
            return { open: true, lines: s.lines.map((l) => (l === existing ? { ...l, ...item, quantity: cap(l.quantity + quantity, item.maxQuantity) } : l)) };
          }
          if (s.lines.length >= MAX_LINES) return { open: true };
          return { open: true, lines: [...s.lines, { ...item, id: item.variantId, quantity: cap(quantity, item.maxQuantity) }] };
        }),
      update: (variantId, quantity) =>
        set((s) => ({ lines: s.lines.map((l) => (l.variantId === variantId ? { ...l, quantity: cap(quantity, l.maxQuantity) } : l)) })),
      remove: (variantId) => {
        const index = get().lines.findIndex((l) => l.variantId === variantId);
        if (index < 0) return undefined;
        const line = get().lines[index];
        set((s) => ({ lines: s.lines.filter((l) => l.variantId !== variantId) }));
        return { line, index };
      },
      restore: (line, index) =>
        set((s) => (s.lines.some((l) => l.variantId === line.variantId) ? s : { lines: [...s.lines.slice(0, index), line, ...s.lines.slice(index)] })),
      clear: () => set({ lines: [], coupon: undefined }),
      setCoupon: (coupon) => set({ coupon: coupon?.trim().toUpperCase() || undefined }),
      setOpen: (open) => set({ open }),
    }),
    {
      name: "wavy-cart",
      version: 2, // v1 lines had color/size; start clean rather than migrate stale price snapshots
      migrate: () => ({ lines: [], coupon: undefined }),
      storage: createJSONStorage(() => localStorage),
      partialize: ({ lines, coupon }) => ({ lines, coupon }),
      skipHydration: true,
    },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantity, 0);

/** PDP / quick view helper: the display snapshot for a variant. */
export const toCartLine = (p: Product, v: ProductVariant): AddToCart => ({
  variantId: v.id, productId: p.id, slug: p.slug, name: p.name, brand: p.brand, image: v.image ?? p.images[0] ?? { url: "", alt: p.name },
  variantTitle: v.title, options: v.options, unitPrice: v.price, compareAt: v.compareAt, maxQuantity: Math.min(v.stock, MAX_PER_LINE),
});

const subscribeHydration = (cb: () => void) => useCart.persist.onFinishHydration(cb);
/** Rehydrates the persisted bag once (client) and reports when it is ready. */
export function useCartHydrated() {
  useEffect(() => { if (!useCart.persist.hasHydrated()) void useCart.persist.rehydrate(); }, []);
  return useSyncExternalStore(subscribeHydration, () => useCart.persist.hasHydrated(), () => false);
}

// ---------- Server quote ----------
export type QuoteOptions = { shippingMethodId?: string; paymentProvider?: PaymentProvider; state?: string; email?: string; enabled?: boolean };
type QuoteResult = { quote?: CartQuote; error?: string };

/** Request body + cache key for a bag quote (also used by CouponForm to prime the cache). */
export const quoteKey = (lines: Pick<CartLine, "variantId" | "quantity">[], couponCode?: string, opts: Omit<QuoteOptions, "enabled"> = {}) =>
  JSON.stringify({ items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })), couponCode, ...opts });

// Server answers by request key: an exact repeat (drawer re-open, bag -> checkout, coupon just applied) renders at once.
// Display only: a fresh entry skips the request, an older one shows while it revalidates; checkout always re-prices.
const FRESH_MS = 10_000;
const MEMO_MAX = 20;
const memo = new Map<string, { quote: CartQuote; at: number }>();
const remember = (key: string, quote: CartQuote) => {
  memo.delete(key);
  memo.set(key, { quote, at: Date.now() });
  if (memo.size > MEMO_MAX) memo.delete(memo.keys().next().value as string);
};
/** Stores a quote the server already returned for `key` (e.g. POST /api/cart/coupon) so the hook doesn't ask again. */
export const primeQuote = (key: string, quote: CartQuote) => remember(key, quote);

let inflight: { key: string; promise: Promise<QuoteResult> } | undefined;
function postQuote(key: string): Promise<QuoteResult> {
  if (inflight?.key !== key) {
    const promise = api<CartQuote>("/api/cart/quote", { body: JSON.parse(key) as unknown })
      .then((r): QuoteResult => {
        if (!r.ok) return { error: r.error.message };
        remember(key, r.data);
        return { quote: r.data };
      })
      .finally(() => { if (inflight?.key === key) inflight = undefined; }); // dedupe concurrent callers only
    inflight = { key, promise };
  }
  return inflight.promise;
}

/** Shopper text for a quote error (line or order level). */
export const quoteErrorText = (e: CartQuote["errors"][number]) =>
  e.code === "insufficient_stock" && e.available ? cartCopy.reduceTo(e.available)
    : e.code === "insufficient_stock" && e.available === 0 ? cartCopy.unavailable
    : pricingErrors[e.code] ?? pricingErrors.unavailable;

/**
 * POST /api/cart/quote for the current bag. The first quote goes out at once; later changes (quantity taps) are
 * debounced 250 ms. Shows the remembered answer for this exact bag at once, else keeps the last quote on screen.
 * `lineErrors` is keyed by variantId; `orderErrors` are shipping/payment/coupon-level messages.
 */
export function useCartQuote({ enabled = true, ...opts }: QuoteOptions = {}) {
  const lines = useCart((s) => s.lines);
  const coupon = useCart((s) => s.coupon);
  const key = enabled && lines.length ? quoteKey(lines, coupon, opts) : "";
  const [res, setRes] = useState<QuoteResult & { key: string }>({ key: "" });
  const hit = key ? memo.get(key) : undefined;
  const quoted = useRef(false);

  useEffect(() => {
    if (!key) return;
    const known = memo.get(key);
    if (known && Date.now() - known.at < FRESH_MS) return;
    let live = true;
    const t = setTimeout(() => void postQuote(key).then((r) => live && setRes({ key, ...r })), quoted.current ? 250 : 0);
    quoted.current = true;
    return () => { live = false; clearTimeout(t); };
  }, [key]);

  const quote = key ? (hit?.quote ?? res.quote) : undefined;
  const lineErrors: Record<string, string> = {};
  const orderErrors: string[] = [];
  for (const e of quote?.errors ?? []) {
    if (e.variantId) lineErrors[e.variantId] ??= quoteErrorText(e);
    else orderErrors.push(quoteErrorText(e));
  }
  return {
    quote, lineErrors, orderErrors, nudges: quote?.offerNudges ?? [],
    loading: !!key && !hit && res.key !== key,
    error: key && res.key === key ? res.error : undefined,
  };
}
export type CartQuoteState = ReturnType<typeof useCartQuote>;
