import { useEffect, useState, useSyncExternalStore } from "react";
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

let inflight: { key: string; promise: Promise<QuoteResult> } | undefined;
function postQuote(key: string): Promise<QuoteResult> {
  if (inflight?.key !== key) {
    const promise = api<CartQuote>("/api/cart/quote", { body: JSON.parse(key) as unknown })
      .then((r): QuoteResult => (r.ok ? { quote: r.data } : { error: r.error.message }))
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
 * Debounced POST /api/cart/quote for the current bag. Keeps the last quote on screen while a new one loads.
 * `lineErrors` is keyed by variantId; `orderErrors` are shipping/payment/coupon-level messages.
 */
export function useCartQuote({ enabled = true, ...opts }: QuoteOptions = {}) {
  const lines = useCart((s) => s.lines);
  const coupon = useCart((s) => s.coupon);
  const key = enabled && lines.length
    ? JSON.stringify({ items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })), couponCode: coupon, ...opts })
    : "";
  const [res, setRes] = useState<QuoteResult & { key: string }>({ key: "" });

  useEffect(() => {
    if (!key) return;
    let live = true;
    const t = setTimeout(() => void postQuote(key).then((r) => live && setRes({ key, ...r })), 250);
    return () => { live = false; clearTimeout(t); };
  }, [key]);

  const quote = key ? res.quote : undefined;
  const lineErrors: Record<string, string> = {};
  const orderErrors: string[] = [];
  for (const e of quote?.errors ?? []) {
    if (e.variantId) lineErrors[e.variantId] ??= quoteErrorText(e);
    else orderErrors.push(quoteErrorText(e));
  }
  return {
    quote, lineErrors, orderErrors, nudges: quote?.offerNudges ?? [],
    loading: !!key && res.key !== key,
    error: key && res.key === key ? res.error : undefined,
  };
}
export type CartQuoteState = ReturnType<typeof useCartQuote>;
