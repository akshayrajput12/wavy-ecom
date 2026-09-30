"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { useCart } from "@/stores/cart";
import { clearDraft } from "../draft";

const PIECES = Array.from({ length: 18 }, (_, i) => ({
  x: Math.cos((i / 18) * Math.PI * 2) * (70 + (i % 3) * 22),
  y: Math.sin((i / 18) * Math.PI * 2) * (60 + (i % 4) * 16) - 20,
  tone: ["bg-accent", "bg-accent-deep", "bg-rating", "bg-accent-hover"][i % 4],
  round: i % 2 === 0,
}));

/** Check-mark draw + one gentle confetti burst (static check for reduced motion). Also empties the bag + draft. */
export function SuccessCelebration() {
  const reduce = useReducedMotion();
  useEffect(() => {
    clearDraft();
    void Promise.resolve(useCart.persist.rehydrate()).then(() => useCart.getState().clear());
  }, []);

  return (
    <div className="relative mx-auto grid size-24 place-items-center" aria-hidden>
      {!reduce && PIECES.map((p, i) => (
        <motion.span key={i} className={`absolute size-2 ${p.tone} ${p.round ? "rounded-pill" : ""}`}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 40], opacity: [0, 1, 0], scale: 1, rotate: i * 40 }}
          transition={{ duration: 1.4, delay: 0.45, ease: "easeOut" }} />
      ))}
      <motion.div className="grid size-24 place-items-center rounded-pill bg-accent-soft"
        initial={reduce ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}>
        <svg viewBox="0 0 52 52" className="size-14 text-accent-deep" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
          <motion.path d="M14 27 L23 36 L39 17" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }} />
        </svg>
      </motion.div>
    </div>
  );
}
