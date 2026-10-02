"use client";

import { clsx } from "clsx";
import { ChevronDown, Minus, Plus, X } from "lucide-react";
import { useId, type ComponentProps, type ReactNode } from "react";
import { uiCopy } from "@/data/copy";

/** Filter / suggestion chip. `onRemove` renders the dismissible "active filter" variant. */
export function Chip({ active, onRemove, children, className, ...rest }: ComponentProps<"button"> & { active?: boolean; onRemove?: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={onRemove ? undefined : active}
      onClick={onRemove ?? rest.onClick}
      className={clsx(
        "inline-flex min-h-11 items-center gap-1.5 rounded-pill border px-4 text-meta font-medium transition-colors",
        active || onRemove ? "border-ink bg-ink text-canvas hover:bg-ink/85" : "border-line bg-transparent text-ink hover:border-ink",
        className,
      )}
      {...rest}
    >
      {children}
      {onRemove && <X className="size-3.5" aria-hidden />}
    </button>
  );
}

export function QuantityStepper({ value, onChange, max, min = 1, label }: { value: number; onChange: (n: number) => void; max: number; min?: number; label: string }) {
  const btn = "grid size-11 place-items-center rounded-pill text-ink transition-colors hover:bg-surface-warm disabled:opacity-30";
  return (
    <div role="group" aria-label={label} className="inline-flex items-center rounded-pill border border-line">
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={uiCopy.decrease}>
        <Minus className="size-3.5" aria-hidden />
      </button>
      <output aria-live="polite" className="w-6 text-center text-body font-medium tabular-nums">{value}</output>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={uiCopy.increase}>
        <Plus className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}

/** Native select with a visible (or visually hidden) label. */
export function Select({ label, hideLabel, className, children, ...rest }: ComponentProps<"select"> & { label: string; hideLabel?: boolean }) {
  const id = useId();
  return (
    <div className={clsx("flex items-center gap-2", className)}>
      <label htmlFor={id} className={clsx("text-meta text-ink-soft", hideLabel && "sr-only")}>{label}</label>
      <div className="relative">
        <select id={id} className="h-11 appearance-none rounded-pill border border-line bg-transparent pl-4 pr-9 text-meta font-medium text-ink transition-colors hover:border-ink focus:border-ink focus:outline-none" {...rest}>
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
      </div>
    </div>
  );
}

/** Disclosure built on <details>: keyboard + screen-reader support is native. */
export function Accordion({ title, children, defaultOpen, name, id }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean; name?: string; id?: string }) {
  return (
    <details id={id} name={name} open={defaultOpen} className="group border-b border-line">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-body font-medium [&::-webkit-details-marker]:hidden">
        {title}
        {/* circular toggle, filled ink when open (reference FAQ) */}
        <span className="grid size-8 shrink-0 place-items-center rounded-pill border border-line transition-colors duration-(--dur-base) group-open:border-ink group-open:bg-ink group-open:text-canvas" aria-hidden>
          <Plus className="size-3.5 transition-transform duration-(--dur-base) ease-soft group-open:rotate-45" />
        </span>
      </summary>
      <div className="pb-5 text-body text-ink-soft">{children}</div>
    </details>
  );
}
