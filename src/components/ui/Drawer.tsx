"use client";

import { clsx } from "clsx";
import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { lockScroll } from "@/components/providers/SmoothScroll";
import { uiCopy } from "@/data/copy";

/**
 * Native <dialog>: focus containment (rest of the page is inert), Escape, top layer and focus
 * return are free. Enter/exit is CSS @starting-style (no JS animation library).
 * `side="center"` is the modal variant; `Modal` below (also exported from ./Modal) is that preset.
 */
const sides = {
  // from sm the right panel floats inset (cart, filters): the extra 1rem keeps the inset edge hidden while closing
  right: "inset-y-0 right-0 left-auto h-dvh max-h-none w-full max-w-md translate-x-full open:translate-x-0 starting:open:translate-x-full sm:inset-y-2 sm:right-2 sm:h-[calc(100dvh-1rem)] sm:rounded-lg sm:translate-x-[calc(100%+1rem)] sm:starting:open:translate-x-[calc(100%+1rem)]",
  left: "inset-y-0 left-0 right-auto h-dvh max-h-none w-full max-w-sm sm:rounded-r-lg -translate-x-full open:translate-x-0 starting:open:-translate-x-full",
  bottom: "inset-x-0 bottom-0 top-auto max-h-[88dvh] w-full max-w-none rounded-t-xl translate-y-full open:translate-y-0 starting:open:translate-y-full",
  center: "inset-0 m-auto! h-fit max-h-[90dvh] w-[calc(100%-2rem)] rounded-lg opacity-0 scale-96 open:opacity-100 open:scale-100 starting:open:opacity-0 starting:open:scale-96",
} as const;
// max-w/max-h live per side (not a shared max-w-none reset): Tailwind sorts max-w-none after max-w-md, which silently won.

const widths = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-3xl", xl: "max-w-5xl" } as const;

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  /** Always required: it labels the dialog. Pass `hideTitle` to keep it for screen readers only. */
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  side?: keyof typeof sides;
  /** Width preset, `side="center"` only. Default `md`. */
  size?: keyof typeof widths;
  hideTitle?: boolean;
  className?: string;
};

export function Drawer({ open, onClose, title, children, footer, side = "right", size = "md", hideTitle, className }: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    if (!open) return;
    return lockScroll();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      data-lenis-prevent
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={clsx(
        "fixed m-0 overflow-hidden bg-canvas p-0 text-ink shadow-lg",
        "transition-[translate,opacity,scale,display,overlay] transition-discrete",
        // sides glide on --ease-soft (an overshoot would expose the page edge); the modal gets the spring
        "duration-(--dur-base) ease-soft open:duration-(--dur-slow)", side === "center" && "open:ease-spring",
        "backdrop:bg-overlay backdrop:opacity-0 backdrop:backdrop-blur-xs backdrop:transition-[opacity,display,overlay] backdrop:duration-(--dur-base) backdrop:transition-discrete",
        "open:backdrop:opacity-100 starting:open:backdrop:opacity-0",
        sides[side],
        side === "center" && widths[size],
        className,
      )}
    >
      <div className={clsx("flex flex-col", side === "center" ? "max-h-[90dvh]" : side === "bottom" ? "max-h-[88dvh]" : "h-full")}>
        {side === "bottom" && <span className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-pill bg-line" aria-hidden />}
        <header className={clsx("flex items-center justify-between gap-4 px-5 py-3", !hideTitle && "border-b border-line-soft")}>
          <h2 id={titleId} className={clsx("t-h3", hideTitle && "sr-only")}>{title}</h2>
          <button type="button" onClick={onClose} aria-label={uiCopy.close} className="-mr-1.5 ml-auto grid size-11 place-items-center rounded-pill border border-line transition-colors hover:border-ink hover:bg-ink hover:text-canvas">
            <X className="size-4.5" aria-hidden />
          </button>
        </header>
        <div className={clsx("flex-1 overflow-y-auto overscroll-contain px-5 pb-5", hideTitle ? "pt-0" : "pt-5")}>{children}</div>
        {footer && <footer className="border-t border-line-soft bg-canvas px-5 py-4">{footer}</footer>}
      </div>
    </dialog>
  );
}

/** Centered dialog (Quick View, size finder). Same API as Drawer minus `side`. */
export function Modal(props: Omit<DrawerProps, "side">) {
  return <Drawer {...props} side="center" />;
}
