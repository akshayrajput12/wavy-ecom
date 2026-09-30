"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PartyPopper, Truck } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { cartExtraCopy as x } from "./copy";

/**
 * Free-delivery meter. `net` = subtotal after discounts (the base compute_pricing compares to the threshold).
 * Crossing the threshold swaps the label with a small spring pop; reduced motion gets a plain swap.
 */
export function FreeShippingProgress({ net, threshold }: { net: number; threshold?: number }) {
  const reduce = useReducedMotion();
  if (!threshold || threshold <= 0) return null;
  const left = Math.max(0, threshold - net);
  const unlocked = left === 0;
  const label = unlocked ? x.freeUnlocked : x.freeLeft(formatPrice(left));

  return (
    <div className="rounded-md bg-accent-soft px-4 py-3">
      <div className="flex min-h-6 items-center gap-2 text-meta font-medium text-ink" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={unlocked ? "on" : "off"}
            className="grid size-6 place-items-center rounded-pill bg-surface text-accent-deep"
            initial={reduce ? false : { scale: 0.4, rotate: unlocked ? -30 : 0, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={reduce ? undefined : { scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 520, damping: 18 }}
            aria-hidden
          >
            {unlocked ? <PartyPopper className="size-3.5" /> : <Truck className="size-3.5" />}
          </motion.span>
        </AnimatePresence>
        <span>{label}</span>
      </div>
      <div
        role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(1, net / threshold) * 100)}
        className="mt-2 h-1.5 overflow-hidden rounded-pill bg-surface"
      >
        <div
          className="h-full origin-left rounded-pill bg-accent-deep transition-transform duration-(--dur-slow) ease-out"
          style={{ transform: `scaleX(${Math.min(1, net / threshold)})` }}
        />
      </div>
    </div>
  );
}
