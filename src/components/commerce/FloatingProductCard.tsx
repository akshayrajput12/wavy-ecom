"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useAnimationFrame, useMotionValue } from "framer-motion";
import { useReducedMotion } from "@/components/ui/useMediaQuery";
import { clsx } from "clsx";
import { GripVertical, Pause, Play } from "lucide-react";
import { EyeIcon, MinusIcon, XIcon } from "@/components/ui/icons";
import { floatingCardCopy as copy, quickViewCopy } from "@/data/storefront";
import type { SpotlightItem } from "@/types/domain";
import { PriceTag } from "./PriceTag";
import { openQuickView } from "./QuickView";
import { dismiss, isDismissed, onDismiss, onVisibility, place, readMinimised, readPos, saveMinimised, savePos } from "./spotlightState";
import { EASE_OUT, KindBadge, MiniPill, Shot, useTilt } from "./SpotlightParts";

const ROTATE_MS = 10_000;
const STEP = 16;
const KEYS: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
const icon = "relative z-10 grid size-11 shrink-0 place-items-center rounded-pill text-ink-soft transition-colors duration-(--dur-fast) hover:bg-surface-2 hover:text-ink";
const pad = (n: number) => String(n).padStart(2, "0");

/** Site-wide floating spotlight (store layout). Hidden below lg on the PDP and bag, whose sticky CTAs own the bottom edge. */
export function FloatingProductCard({ items }: { items: SpotlightItem[] }) {
  const dismissed = useSyncExternalStore(onDismiss, isDismissed, () => true);
  const pathname = usePathname();
  if (!items.length || dismissed) return null;
  const crowded = pathname.startsWith("/products/") || pathname === "/cart";
  return <Spotlight items={items} className={clsx(crowded && "max-lg:hidden")} />;
}

/**
 * Paper-and-glass card: packshot on its well, overline pill, name, price and a Quick view cue; a "01 —— 12" hairline
 * tracks the 10s rotation. Drags from anywhere (a drag never fires the click under it), minimises to a light pill.
 */
function Spotlight({ items, className }: { items: SpotlightItem[]; className?: string }) {
  const reduce = useReducedMotion();
  const tabHidden = useSyncExternalStore(onVisibility, () => document.visibilityState === "hidden", () => false);
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [min, setMin] = useState(readMinimised); // client-only: the parent renders null until hydrated
  const progress = useMotionValue(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const ref = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);
  const tilt = useTilt(!reduce);
  const paused = hover || focus || stopped || tabHidden || items.length < 2;

  useAnimationFrame((_, delta) => {
    if (paused) return;
    const next = progress.get() + delta / ROTATE_MS;
    if (next < 1) { progress.set(next); return; }
    progress.set(0);
    setIndex((i) => (i + 1) % items.length);
  });

  // Restore the saved spot; pull the card back on screen when the viewport shrinks or the card changes size.
  useEffect(() => {
    const saved = readPos();
    place(ref.current, x, y, saved?.x, saved?.y);
    const reclamp = () => place(ref.current, x, y);
    const ro = new ResizeObserver(reclamp);
    if (ref.current) ro.observe(ref.current);
    window.addEventListener("resize", reclamp);
    return () => { ro.disconnect(); window.removeEventListener("resize", reclamp); };
  }, [x, y]);

  const save = () => savePos(x.get(), y.get());
  const onKey = (e: KeyboardEvent) => {
    const d = KEYS[e.key];
    if (!d) return;
    e.preventDefault();
    place(ref.current, x, y, x.get() + d[0] * STEP, y.get() + d[1] * STEP);
    save();
  };
  const toggleMin = (v: boolean) => { setMin(v); saveMinimised(v); };
  // A drag ends with a click on whatever is under the pointer: swallow that one.
  const onClickCapture = (e: MouseEvent) => { if (dragged.current) { e.preventDefault(); e.stopPropagation(); dragged.current = false; } };

  const { product, kind } = items[index % items.length];
  const media = product.images[0];
  const t = (delay = 0) => (reduce ? { duration: 0 } : { duration: 0.5, ease: EASE_OUT, delay });
  const rise = (delay: number) => ({ initial: { opacity: 0, y: reduce ? 0 : 8 }, animate: { opacity: 1, y: 0 }, transition: t(delay) });
  const off = { opacity: 0, y: reduce ? 0 : 8, scale: reduce ? 1 : 0.96 };
  const pop = { initial: off, animate: { opacity: 1, y: 0, scale: 1 }, exit: off, transition: t() };

  return (
    <>
      {/* drag bounds: the viewport below the fixed header (see place()) */}
      <div ref={viewport} className="pointer-events-none fixed inset-x-0 bottom-0 top-(--header-h)" aria-hidden />
      <motion.aside
        ref={ref}
        aria-label={copy.region}
        drag
        dragConstraints={viewport}
        dragElastic={0}
        dragMomentum={false}
        onDragStart={() => { dragged.current = true; }}
        onDragEnd={() => { save(); window.setTimeout(() => { dragged.current = false; }, 0); }}
        onClickCapture={onClickCapture}
        style={{ x, y }}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        onFocus={() => setFocus(true)}
        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocus(false); }}
        className={clsx("fixed bottom-4 left-4 z-30 touch-none select-none", className)}
      >
        <AnimatePresence mode="wait" initial={false}>
          {min ? (
            <motion.div key="pill" {...pop} className="origin-bottom-left">
              <button type="button" onClick={() => toggleMin(false)} onKeyDown={onKey} aria-label={copy.expand(product.name)} aria-expanded={false}
                className="block rounded-pill transition-transform duration-(--dur-base) ease-soft hover:-translate-y-0.5">
                <MiniPill id={product.id} media={media} kind={kind} progress={progress} reduce={reduce} />
              </button>
            </motion.div>
          ) : (
            <motion.div key="card" {...pop}
              className="group/card w-88 max-w-[calc(100vw-2rem)] origin-bottom-left overflow-hidden rounded-xl border border-line bg-surface/85 shadow-lg backdrop-blur-xl">
              {/* Stretched button: the whole body opens Quick View (a <p> price can't live inside a <button>).
                  No positioned or transformed ancestor between the button and this body, or the overlay shrinks to it. */}
              <div className="relative flex gap-4 p-3 pb-2" {...tilt.handlers}>
                <Shot id={product.id} media={media} tilt={tilt.style} reduce={reduce} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="-mr-1.5 -mt-1.5 flex items-center justify-between gap-1">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span key={`${product.id}-k`} {...rise(0)} exit={{ opacity: 0 }}><KindBadge kind={kind} /></motion.span>
                    </AnimatePresence>
                    <div className="flex">
                      <button type="button" aria-label={copy.minimise} aria-expanded onClick={() => toggleMin(true)} className={icon}><MinusIcon className="size-4" /></button>
                      <button type="button" aria-label={copy.close} onClick={dismiss} className={icon}><XIcon className="size-4" /></button>
                    </div>
                  </div>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div key={product.id} className="flex flex-1 flex-col"
                      initial={{ opacity: 1 }} exit={{ opacity: 0, y: reduce ? 0 : -4 }} transition={reduce ? { duration: 0 } : { duration: 0.2 }}>
                      <button type="button" onClick={() => openQuickView(product)} aria-label={quickViewCopy.open(product.name)}
                        className="text-left font-display text-body-lg font-heading-sm leading-snug tracking-tight text-ink after:absolute after:inset-0 after:rounded-xl after:content-['']">
                        <motion.span {...rise(0.04)} className="line-clamp-2">{product.name}</motion.span>
                      </button>
                      <motion.div {...rise(0.1)}><PriceTag price={product.priceFrom} compareAt={product.compareAtFrom} className="mt-1" /></motion.div>
                      <motion.span {...rise(0.16)} aria-hidden className="mt-auto flex items-center justify-between pt-2 text-meta font-medium text-ink">
                        <span className="underline decoration-line underline-offset-4 transition-colors duration-(--dur-base) group-hover/card:decoration-ink">{quickViewCopy.label}</span>
                        <span className="grid size-9 place-items-center rounded-pill bg-ink text-canvas shadow-sm transition-transform duration-(--dur-base) ease-soft group-hover/card:scale-110">
                          <EyeIcon className="size-4" strokeWidth={1.8} />
                        </span>
                      </motion.span>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-line-soft px-0.5">
                <button type="button" aria-label={copy.move} onKeyDown={onKey}
                  className={clsx(icon, "cursor-grab opacity-50 group-hover/card:opacity-100 focus-visible:opacity-100 active:cursor-grabbing")}>
                  <GripVertical className="size-4" aria-hidden />
                </button>
                {items.length > 1 && (
                  <>
                    <span className="flex flex-1 items-center gap-2.5 text-ink-soft" aria-hidden>
                      <span className="t-index text-ink">{pad(index + 1)}</span>
                      <span className="relative h-px flex-1 overflow-hidden bg-line">
                        <motion.span className="absolute inset-0 origin-left bg-ink" style={{ scaleX: progress }} />
                      </span>
                      <span className="t-index">{pad(items.length)}</span>
                    </span>
                    <button type="button" aria-label={stopped ? copy.play : copy.pause} onClick={() => setStopped((s) => !s)} className={icon}>
                      {stopped ? <Play className="size-3.5 fill-current" aria-hidden /> : <Pause className="size-3.5 fill-current" aria-hidden />}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </>
  );
}
