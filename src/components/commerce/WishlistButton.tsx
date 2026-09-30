"use client";

import { clsx } from "clsx";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useWishlist } from "@/stores/wishlist";
import { productCopy } from "@/data/content";

export function WishlistButton({ productId, name, className, variant = "overlay" }: { productId: string; name: string; className?: string; variant?: "overlay" | "outline" }) {
  const saved = useWishlist((s) => s.ids.includes(productId));
  const toggle = useWishlist((s) => s.toggle);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={`${saved ? productCopy.wishlistRemove : productCopy.wishlistAdd}: ${name}`}
      onClick={() => toast(toggle(productId) ? `Saved ${name} to your wishlist` : `Removed ${name} from your wishlist`)}
      className={clsx(
        "grid size-11 place-items-center rounded-pill transition-colors",
        variant === "overlay" ? "bg-surface/80 backdrop-blur-sm hover:bg-surface" : "border border-line bg-surface hover:border-ink",
        className,
      )}
    >
      <Heart className={clsx("size-[18px] transition-transform active:scale-90", saved ? "fill-ink text-ink" : "text-ink")} strokeWidth={1.6} aria-hidden />
    </button>
  );
}
