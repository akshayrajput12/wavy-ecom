import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface WishlistState {
  ids: string[];
  toggle: (productId: string) => boolean; // returns true when now saved
  remove: (productId: string) => void;
}

/** Guest wishlist (product ids) in localStorage. Rehydrated by <CartDrawer> on mount alongside the cart. */
export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const saved = !get().ids.includes(id);
        set({ ids: saved ? [...get().ids, id] : get().ids.filter((x) => x !== id) });
        return saved;
      },
      remove: (id) => set({ ids: get().ids.filter((x) => x !== id) }),
    }),
    { name: "wavy-wishlist", storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);
