"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useDragControls, type PanInfo } from "framer-motion";
import { useReducedMotion } from "@/components/ui/useMediaQuery";
import { XIcon } from "@/components/ui/icons";
import { lockScroll } from "@/components/providers/SmoothScroll";
import { useMediaQuery } from "@/components/ui/useMediaQuery";
import { quickViewCopy } from "@/data/storefront";

const SPRING = { type: "spring", stiffness: 380, damping: 34, mass: 0.9 } as const;
const SHEET = { type: "spring", stiffness: 420, damping: 42 } as const;

/**
 * Quick View shell. A native <dialog> (showModal) gives the focus trap, inert page, top layer and focus return;
 * Framer Motion animates a blurred overlay and the panel: a spring scale-in modal from md, a bottom sheet with
 * drag-to-close below it, and a plain fade for reduced motion. Escape and overlay clicks animate out first,
 * then the dialog closes.
 */
export function QuickViewDialog({ open, onClose, labelledBy, children }: {
  open: boolean; onClose: () => void; labelledBy: string; children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const reduce = useReducedMotion();
  const desktop = useMediaQuery("(min-width: 768px)");
  const drag = useDragControls();

  useEffect(() => {
    const d = ref.current;
    if (!open || !d) return;
    if (!d.open) d.showModal();
    return lockScroll();
  }, [open]);

  const panel = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.2 } }
    : desktop
      ? { initial: { opacity: 0, scale: 0.96, y: 12 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.97, y: 8 }, transition: SPRING }
      : { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" }, transition: SHEET };
  const sheetDrag = !desktop && !reduce;
  const onDragEnd = (_: unknown, info: PanInfo) => { if (info.offset.y > 120 || info.velocity.y > 600) onClose(); };

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClose={() => { if (open) onClose(); }} // the browser may force-close on a repeated Escape
      className="fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden bg-transparent p-0 text-ink backdrop:bg-transparent"
    >
      <AnimatePresence onExitComplete={() => ref.current?.close()}>
        {open && (
          <motion.div key="overlay" aria-hidden onClick={onClose} className="absolute inset-0 bg-overlay backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0.15 : 0.32 }} />
        )}
        {open && (
          <div key="frame" className="pointer-events-none absolute inset-0 flex items-end justify-center md:items-center md:p-6">
            <motion.div
              {...panel}
              drag={sheetDrag ? "y" : false}
              dragListener={false}
              dragControls={drag}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.7 }}
              onDragEnd={onDragEnd}
              className="pointer-events-auto relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-xl bg-canvas shadow-lg md:h-[min(88dvh,740px)] md:max-h-none md:max-w-5xl md:rounded-xl"
            >
              {/* drag handle: pointer-only affordance; keyboard and screen readers use the close button */}
              <div aria-hidden onPointerDown={(e) => sheetDrag && drag.start(e)} title={quickViewCopy.dragToClose}
                className="flex shrink-0 cursor-grab touch-none justify-center pb-1 pt-2.5 active:cursor-grabbing md:hidden">
                <span className="h-1 w-10 rounded-pill bg-line" />
              </div>
              <button type="button" onClick={onClose} aria-label={quickViewCopy.close}
                className="absolute right-3 top-3 z-20 grid size-11 place-items-center rounded-pill border border-line bg-canvas/90 backdrop-blur-sm transition-colors hover:border-ink hover:bg-ink hover:text-canvas md:right-4 md:top-4">
                <XIcon className="size-4.5" />
              </button>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain md:overflow-hidden" data-lenis-prevent>{children}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </dialog>
  );
}
