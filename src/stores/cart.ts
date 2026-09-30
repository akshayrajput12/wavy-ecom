import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CartLine, Product, ProductVariant } from "@/types/domain";

const MAX_PER_LINE = 10;

interface CartState {
  lines: CartLine[];
  coupon?: string;
  open: boolean;
  add: (line: Omit<CartLine, "id" | "quantity">, quantity?: number) => void;
  update: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  setCoupon: (code?: string) => void;
  setOpen: (open: boolean) => void;
}

/**
 * Cart UI state only (guest bag, persisted to localStorage). Prices shown are display estimates;
 * the server recomputes everything at checkout. `skipHydration` avoids SSR mismatches —
 * <CartDrawer> calls `useCart.persist.rehydrate()` once on mount.
 */
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      open: false,
      add: (line, quantity = 1) =>
        set((s) => {
          const existing = s.lines.find((l) => l.variantId === line.variantId);
          const cap = Math.min(line.maxQuantity, MAX_PER_LINE);
          if (existing) {
            return { lines: s.lines.map((l) => (l === existing ? { ...l, ...line, quantity: Math.min(l.quantity + quantity, cap) } : l)) };
          }
          return { lines: [...s.lines, { ...line, id: line.variantId, quantity: Math.min(quantity, cap) }] };
        }),
      update: (id, quantity) =>
        set((s) => ({
          lines: quantity <= 0
            ? s.lines.filter((l) => l.id !== id)
            : s.lines.map((l) => (l.id === id ? { ...l, quantity: Math.min(quantity, l.maxQuantity, MAX_PER_LINE) } : l)),
        })),
      remove: (id) => set((s) => ({ lines: s.lines.filter((l) => l.id !== id) })),
      clear: () => set({ lines: [], coupon: undefined }),
      setCoupon: (coupon) => set({ coupon }),
      setOpen: (open) => set({ open }),
    }),
    {
      name: "wavy-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ lines, coupon }) => ({ lines, coupon }),
      skipHydration: true,
    },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantity, 0);

export const toCartLine = (p: Product, v: ProductVariant): Omit<CartLine, "id" | "quantity"> => ({
  variantId: v.id, productId: p.id, name: p.name, image: v.image ?? p.images[0],
  color: v.color, size: v.size, unitPrice: v.price, maxQuantity: Math.min(v.stock, MAX_PER_LINE),
});
