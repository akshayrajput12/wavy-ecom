"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/components/ui/useMediaQuery";
import { PlusIcon } from "@/components/ui/icons";
import { useId, useState } from "react";
import type { Faq } from "@/types/domain";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Single-open accordion with hairlines; the +/− circle fills ink when open. First question starts open. */
export function FaqAccordion({ faqs, className }: { faqs: Faq[]; className?: string }) {
  const [open, setOpen] = useState<string | null>(faqs[0]?.id ?? null);
  const reduce = useReducedMotion();
  const base = useId();
  return (
    <div className={clsx("border-t border-line", className)}>
      {faqs.map((f) => {
        const isOpen = open === f.id;
        const id = `${base}-${f.id}`;
        return (
          <div key={f.id} className="border-b border-line">
            <h3>
              <button type="button" id={`${id}-q`} aria-expanded={isOpen} aria-controls={`${id}-a`} onClick={() => setOpen(isOpen ? null : f.id)}
                className="flex min-h-16 w-full items-center justify-between gap-6 py-4 text-left text-body-lg font-medium">
                {f.question}
                <span aria-hidden className={clsx("grid size-8 shrink-0 place-items-center rounded-pill border transition-colors duration-(--dur-base) ease-soft",
                  isOpen ? "border-ink bg-ink text-canvas" : "border-line text-ink")}>
                  <PlusIcon className="size-3.5" open={isOpen} />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div key="a" id={`${id}-a`} role="region" aria-labelledby={`${id}-q`} className="overflow-hidden"
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: reduce ? 0 : 0.36, ease: EASE_OUT }}>
                  <p className="max-w-prose whitespace-pre-line pb-6 pr-14 text-body text-ink-soft">{f.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
