"use client";

import { clsx } from "clsx";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { homeCopy } from "@/data/storefront";
import { obj, str, type Cfg, type Lookups } from "./shared";

/** What every mini mock receives: the live (unsaved) form values. */
export interface MockProps { cfg: Cfg; title: string; subtitle: string; lookups: Lookups }

/** Picked labels in order, or the first of `all` when nothing is picked ("empty = all"), capped at `limit`. */
export function labels(all: { id: string; label: string }[], picked: string[], limit?: unknown): string[] {
  const list = picked.length ? picked.map((id) => all.find((o) => o.id === id)?.label ?? id) : all.map((o) => o.label);
  return typeof limit === "number" ? list.slice(0, limit) : list;
}

/** Image box with the "No image yet" placeholder for a missing or broken src. `className` must position it (relative/absolute). */
export function Img({ src, alt, className, compact }: { src: string; alt: string; className: string; compact?: boolean }) {
  return (
    <div className={clsx("overflow-hidden bg-surface-2", className)}>
      <SafeImage src={src} alt={alt} sizes="320px" compact={compact} />
    </div>
  );
}

export const Overline = ({ children, className }: { children: ReactNode; className?: string }) =>
  <p className={clsx("t-overline text-ink-soft", className)}>{children}</p>;

/** "*word*" accent markup as the storefront renders it (an <em> in the accent face), not raw asterisks. */
const accented = (text: string) => text.split(/\*([^*]+)\*/).map((part, i) => (i % 2 ? <em key={i} className="t-accent">{part}</em> : part));

/** Display heading at mock scale. Empty text shows a muted placeholder so the layout keeps its shape. */
export function Title({ text, fallback, soft, className }: { text: string; fallback: string; soft?: string; className?: string }) {
  return (
    <p className={clsx("font-display font-semibold leading-tight tracking-tight text-balance", className)}>
      {text ? accented(text) : <span className="text-ink-muted">{fallback}</span>}
      {soft && <span className="text-ink-soft"> {soft}</span>}
    </p>
  );
}

/** Mirrors the storefront ButtonLink: ink pill (or outline). Not interactive: it is a picture of a button. */
export function Pill({ label, outline, className }: { label: string; outline?: boolean; className?: string }) {
  if (!label) return null;
  return (
    <span className={clsx("inline-flex h-7 items-center gap-1 rounded-pill px-3 text-micro font-medium",
      outline ? "border border-line text-ink" : "bg-ink text-canvas", className)}>
      {label}{!outline && <ChevronRight className="size-3" aria-hidden />}
    </span>
  );
}

/** Mirrors SectionHead: overline + heading (subtitle greyed) left, "View all ›" right. */
export function Head({ overline, title, subtitle, fallback, more }: { overline?: string; title: string; subtitle?: string; fallback: string; more?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        {overline && <Overline className="mb-1">{overline}</Overline>}
        <Title text={title} soft={subtitle} fallback={fallback} className="text-body-lg" />
      </div>
      {more && <span className="shrink-0 text-micro font-medium underline decoration-line underline-offset-2">{more} ›</span>}
    </div>
  );
}

/** Grey text bars standing in for content the storefront fills in (product names, quotes, post titles). */
export const Bars = ({ n = 2, className }: { n?: number; className?: string }) => (
  <span className={clsx("flex flex-col gap-1", className)} aria-hidden>
    {Array.from({ length: n }, (_, i) => <span key={i} className={clsx("h-1.5 rounded-pill bg-line", i === n - 1 && n > 1 ? "w-2/3" : "w-full")} />)}
  </span>
);

export const ctaLabel = (cfg: Cfg) => str(obj(cfg, "cta"), "label");
export const viewAll = homeCopy.viewAll;
