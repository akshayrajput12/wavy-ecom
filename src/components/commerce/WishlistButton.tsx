"use client";

import { clsx } from "clsx";
import { useState } from "react";
import { toast } from "sonner";
import { useWishlist } from "@/stores/wishlist";
import { HeartIcon } from "@/components/ui/icons";
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
  const [taps, setTaps] = useState(0); // pulse on the shopper's toggle only, not on the localStorage restore
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={`${saved ? productCopy.wishlistRemove : productCopy.wishlistAdd}: ${name}`}
      onClick={() => {
        const now = toggle(productId);
        setTaps((n) => n + 1);
        sync(productId, now);
        toast(now ? `${productCopy.wishlistAdd}: ${name}` : `${productCopy.wishlistRemove}: ${name}`);
      }}
      className={clsx(
        "grid size-11 place-items-center rounded-pill transition-colors duration-(--dur-fast)",
        variant === "overlay" ? "bg-surface/90 text-ink shadow-sm backdrop-blur-sm hover:bg-surface" : "border border-line text-ink hover:border-ink",
        className,
      )}
    >
      <HeartIcon className={clsx("size-4.5 text-ink transition-[fill] duration-(--dur-fast)", saved && "fill-ink")} strokeWidth={1.6} trigger={taps} />
    </button>
  );
}
