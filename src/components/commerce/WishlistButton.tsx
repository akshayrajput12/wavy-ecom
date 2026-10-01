"use client";

import { clsx } from "clsx";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useWishlist } from "@/stores/wishlist";
import { productCopy } from "@/data/copy";

/** Saves on this device and, when signed in, to the account (a 401 for guests is expected and ignored). */
function sync(productId: string, saved: boolean) {
  void fetch("/api/account/wishlist", {
    method: saved ? "POST" : "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ productId }),
  }).catch(() => undefined);
}

export function WishlistButton({ productId, name, className, variant = "overlay" }: {
  productId: string; name: string; className?: string; variant?: "overlay" | "outline";
}) {
  const saved = useWishlist((s) => s.ids.includes(productId));
  const toggle = useWishlist((s) => s.toggle);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={`${saved ? productCopy.wishlistRemove : productCopy.wishlistAdd}: ${name}`}
      onClick={() => {
        const now = toggle(productId);
        sync(productId, now);
        toast(now ? `${productCopy.wishlistAdd}: ${name}` : `${productCopy.wishlistRemove}: ${name}`);
      }}
      className={clsx(
        "grid size-11 place-items-center rounded-pill transition-colors duration-(--dur-fast)",
        variant === "overlay" ? "bg-surface/90 text-ink shadow-sm backdrop-blur-sm hover:bg-surface" : "border border-line text-ink hover:border-ink",
        className,
      )}
    >
      <Heart className={clsx("size-4.5 transition-transform duration-(--dur-fast) active:scale-90", saved ? "fill-ink text-ink" : "text-ink")} strokeWidth={1.6} aria-hidden />
    </button>
  );
}
