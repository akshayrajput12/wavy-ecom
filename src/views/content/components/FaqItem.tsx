"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { useId, useState } from "react";

/** One FAQ row: hairline, question button with a circular +/− toggle (ink when open), animated answer region. */
export function FaqItem({ question, answer, defaultOpen = false }: { question: string; answer: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const reduce = useReducedMotion();
  const id = useId();
  const Icon = open ? Minus : Plus;
  return (
    <div className="border-b border-line">
      <h3>
        <button type="button" id={`${id}-q`} aria-expanded={open} aria-controls={`${id}-a`} onClick={() => setOpen((o) => !o)}
          className="flex min-h-16 w-full items-center justify-between gap-6 py-4 text-left text-body font-medium">
          {question}
          <span aria-hidden className={clsx(
            "grid size-8 shrink-0 place-items-center rounded-pill border transition-colors duration-(--dur-base)",
            open ? "border-ink bg-ink text-canvas" : "border-line text-ink",
          )}>
            <Icon className="size-3.5" />
          </span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div id={`${id}-a`} role="region" aria-labelledby={`${id}-q`} className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            <p className="max-w-[68ch] whitespace-pre-line pb-6 pr-14 text-body text-ink-soft">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
