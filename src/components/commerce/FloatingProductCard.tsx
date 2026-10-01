"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useAnimationFrame, useDragControls, useMotionValue, useReducedMotion, type MotionValue } from "framer-motion";
import { clsx } from "clsx";
import { GripVertical, Pause, Play, ShoppingBag, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { floatingCardCopy as copy, quickViewCopy } from "@/data/storefront";
import type { SpotlightItem } from "@/types/domain";
import { ImageWell } from "./ImageWell";
import { PriceTag } from "./PriceTag";
import { openQuickView } from "./QuickView";

const ROTATE_MS = 10_000;
const STEP = 16;
const POS_KEY = "wavy-spotlight-pos";
const DISMISS_KEY = "wavy-spotlight-dismissed";
const DISMISS_EVENT = "wavy:spotlight-dismissed";
const EASE_OUT = [0.22, 1, 0.36, 1] as const; // mirrors --ease-out
const KEYS: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
const icon = "grid size-11 shrink-0 place-items-center rounded-pill text-ink-soft transition-colors duration-(--dur-fast) hover:text-ink";

let closed = false; // in-memory fallback when sessionStorage is blocked
const isDismissed = () => { if (closed) return true; try { return sessionStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; } };
const dismiss = () => {
  closed = true;
  try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* storage blocked: closed until reload */ }
  window.dispatchEvent(new Event(DISMISS_EVENT));
};
const onDismiss = (cb: () => void) => { window.addEventListener(DISMISS_EVENT, cb); return () => window.removeEventListener(DISMISS_EVENT, cb); };
const onVisibility = (cb: () => void) => { document.addEventListener("visibilitychange", cb); return () => document.removeEventListener("visibilitychange", cb); };

const readPos = (): { x: number; y: number } | null => {
  try {
    const p: unknown = JSON.parse(localStorage.getItem(POS_KEY) ?? "null");
    return p && typeof p === "object" && "x" in p && "y" in p && typeof p.x === "number" && typeof p.y === "number" ? { x: p.x, y: p.y } : null;
  } catch { return null; }
};
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi));

/** Moves the card to offset (nx, ny), kept fully inside the viewport. Assumes the current offset is already painted. */
function place(el: HTMLElement | null, x: MotionValue<number>, y: MotionValue<number>, nx = x.get(), ny = y.get()) {
  const r = el?.getBoundingClientRect();
  if (!r?.width) { x.set(nx); y.set(ny); return; } // hidden (display: none): nothing to measure yet
  const left = r.left - x.get(), top = r.top - y.get();
  x.set(clamp(nx, -left, window.innerWidth - left - r.width));
  y.set(clamp(ny, -top, window.innerHeight - top - r.height));
}

/** Site-wide floating spotlight (store layout). Hidden below lg on the PDP and bag, whose sticky CTAs own the bottom edge. */
export function FloatingProductCard({ items }: { items: SpotlightItem[] }) {
  const dismissed = useSyncExternalStore(onDismiss, isDismissed, () => true);
  const pathname = usePathname();
  if (!items.length || dismissed) return null;
  const crowded = pathname.startsWith("/products/") || pathname === "/cart";
  return <Spotlight items={items} className={clsx(crowded && "max-lg:hidden")} />;
}

function Spotlight({ items, className }: { items: SpotlightItem[]; className?: string }) {
  const reduce = useReducedMotion();
  const tabHidden = useSyncExternalStore(onVisibility, () => document.visibilityState === "hidden", () => false);
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [stopped, setStopped] = useState(false);
  const progress = useMotionValue(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const ref = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useDragControls();
  const paused = hover || focus || stopped || tabHidden || items.length < 2;

  useAnimationFrame((_, delta) => {
    if (paused) return;
    const next = progress.get() + delta / ROTATE_MS;
    if (next < 1) { progress.set(next); return; }
    progress.set(0);
    setIndex((i) => (i + 1) % items.length);
  });

  // Restore the saved spot, and pull the card back on screen when the viewport shrinks.
  useEffect(() => {
    const saved = readPos();
    place(ref.current, x, y, saved?.x, saved?.y);
    const onResize = () => place(ref.current, x, y);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [x, y]);

  const save = () => { try { localStorage.setItem(POS_KEY, JSON.stringify({ x: x.get(), y: y.get() })); } catch { /* storage blocked */ } };
  const onKey = (e: KeyboardEvent) => {
    const d = KEYS[e.key];
    if (!d) return;
    e.preventDefault();
    place(ref.current, x, y, x.get() + d[0] * STEP, y.get() + d[1] * STEP);
    save();
  };

  const { product, kind } = items[index % items.length];
  const transition = reduce ? { duration: 0 } : { duration: 0.32, ease: EASE_OUT };

  return (
    <>
      <div ref={viewport} className="pointer-events-none fixed inset-0" aria-hidden />
      <motion.aside
        ref={ref}
        aria-label={copy.region}
        drag
        dragListener={false}
        dragControls={drag}
        dragConstraints={viewport}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={save}
        style={{ x, y }}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        onFocus={() => setFocus(true)}
        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocus(false); }}
        className={clsx(
          "fixed bottom-4 left-4 z-30 w-64 overflow-hidden rounded-xl border border-line bg-surface/90 shadow-lg backdrop-blur-md sm:w-76",
          className,
        )}
      >
        <div className="flex items-center gap-1 pr-1">
          <button type="button" aria-label={copy.move} onPointerDown={(e) => drag.start(e)} onKeyDown={onKey}
            className={clsx(icon, "cursor-grab touch-none active:cursor-grabbing")}>
            <GripVertical className="size-4" aria-hidden />
          </button>
          <Badge tone={kind === "new" ? "dark" : "outline"}>{copy.kind[kind]}</Badge>
          <span className="flex-1" />
          {items.length > 1 && (
            <button type="button" aria-label={stopped ? copy.play : copy.pause} onClick={() => setStopped((s) => !s)} className={icon}>
              {stopped ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
            </button>
          )}
          <button type="button" aria-label={copy.close} onClick={dismiss} className={icon}>
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={product.id} className="group relative flex items-center gap-3 px-3 pb-4"
            initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={transition}>
            <ImageWell media={product.images[0]} alt="" sizes="64px" className="aspect-[4/5] w-12 shrink-0 rounded-md sm:w-14"
              imgClassName="transition-[scale] duration-500 ease-soft group-hover:scale-[1.04]" />
            <div className="min-w-0 flex-1">
              {/* Stretched button: the whole row opens Quick View (a <p> price can't live inside a <button>). */}
              <button type="button" onClick={() => openQuickView(product)} aria-label={quickViewCopy.open(product.name)}
                className="text-left text-meta font-medium text-ink after:absolute after:inset-0 after:content-['']">
                <span className="line-clamp-2">{product.name}</span>
              </button>
              <PriceTag price={product.priceFrom} compareAt={product.compareAtFrom} className="mt-0.5" />
            </div>
            <span className="grid size-9 shrink-0 place-items-center rounded-pill bg-ink text-canvas transition-transform duration-(--dur-base) ease-soft group-hover:scale-110" aria-hidden>
              <ShoppingBag className="size-4" strokeWidth={1.8} />
            </span>
          </motion.div>
        </AnimatePresence>
        {items.length > 1 && (
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-line" aria-hidden>
            <motion.div style={{ scaleX: progress }} className="h-full origin-left bg-ink" />
          </div>
        )}
      </motion.aside>
    </>
  );
}
