"use client";

import { clsx } from "clsx";
import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * Native <dialog> (focus trap, Escape, top layer for free) animated with CSS @starting-style.
 * `side="center"` is the modal variant; `Modal` below is just that preset.
 */
const sides = {
  right: "inset-y-0 right-0 left-auto h-dvh w-full max-w-md translate-x-full open:translate-x-0 starting:open:translate-x-full",
  left: "inset-y-0 left-0 right-auto h-dvh w-full max-w-sm -translate-x-full open:translate-x-0 starting:open:-translate-x-full",
  bottom: "inset-x-0 bottom-0 top-auto max-h-[88dvh] w-full rounded-t-lg translate-y-full open:translate-y-0 starting:open:translate-y-full",
  center: "inset-0 m-auto! h-fit max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg rounded-lg opacity-0 scale-95 open:opacity-100 open:scale-100 starting:open:opacity-0 starting:open:scale-95",
} as const;

type Props = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  side?: keyof typeof sides;
  className?: string;
};

export function Drawer({ open, onClose, title, children, footer, side = "right", className }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    if (!open) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => { html.style.overflow = prev; };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      data-lenis-prevent
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={clsx(
        "fixed m-0 max-h-none max-w-none overflow-hidden bg-canvas p-0 text-ink shadow-lg",
        "transition-[translate,opacity,scale,display,overlay] duration-300 ease-out transition-discrete",
        "backdrop:bg-ink/40 backdrop:opacity-0 backdrop:transition-[opacity,display,overlay] backdrop:duration-300 backdrop:transition-discrete",
        "open:backdrop:opacity-100 starting:open:backdrop:opacity-0",
        sides[side],
        className,
      )}
    >
      <div className={clsx("flex flex-col", side === "center" ? "max-h-[90dvh]" : side === "bottom" ? "max-h-[88dvh]" : "h-full")}>
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
          <h2 id={titleId} className="t-h3">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 grid size-11 place-items-center rounded-pill hover:bg-surface-warm">
            <X className="size-5" aria-hidden />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
        {footer && <footer className="border-t border-line bg-surface px-5 py-4">{footer}</footer>}
      </div>
    </dialog>
  );
}

export function Modal(props: Omit<Props, "side">) {
  return <Drawer {...props} side="center" />;
}
