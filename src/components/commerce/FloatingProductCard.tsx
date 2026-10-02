"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useAnimationFrame, useMotionValue } from "framer-motion";
import { useReducedMotion } from "@/components/ui/useMediaQuery";
import { clsx } from "clsx";
import { Eye, GripVertical, Minus, Pause, Play, X } from "lucide-react";
import { floatingCardCopy as copy, quickViewCopy } from "@/data/storefront";
import type { SpotlightItem } from "@/types/domain";
import { ImageWell } from "./ImageWell";
import { PriceTag } from "./PriceTag";
import { openQuickView } from "./QuickView";
import { dismiss, isDismissed, onDismiss, onVisibility, place, readMinimised, readPos, saveMinimised, savePos } from "./spotlightState";
import { EASE_OUT, FloatingShot, Glow, KindBadge, ProgressRing, useTilt } from "./SpotlightParts";

const ROTATE_MS = 10_000;
const STEP = 16;
const KEYS: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
const icon = "grid size-11 shrink-0 place-items-center rounded-pill text-ink-soft transition-colors duration-(--dur-fast) hover:bg-ink/10 hover:text-ink";

/** Site-wide floating spotlight (store layout). Hidden below lg on the PDP and bag, whose sticky CTAs own the bottom edge. */
export function FloatingProductCard({ items }: { items: SpotlightItem[] }) {
  const dismissed = useSyncExternalStore(onDismiss, isDismissed, () => true);
  const pathname = usePathname();
  if (!items.length || dismissed) return null;
  const crowded = pathname.startsWith("/products/") || pathname === "/cart";
  return <Spotlight items={items} className={clsx(crowded && "max-lg:hidden")} />;
}

/**
 * Dark mini stage: the product's own colours glow behind a tilting packshot; name, price and a Quick view pill
 * slide in per product. Drags from anywhere (a drag never fires the click under it), minimises to a bubble.
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
  const t = (delay = 0) => (reduce ? { duration: 0 } : { duration: 0.45, ease: EASE_OUT, delay });
  const rise = (delay: number) => ({ initial: { opacity: 0, y: reduce ? 0 : 10 }, animate: { opacity: 1, y: 0 }, transition: t(delay) });
  const pop = { initial: { opacity: 0, scale: reduce ? 1 : 0.6 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: reduce ? 1 : 0.6 }, transition: t() };
  const counter = `${String(index + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
  const playPause = items.length > 1 && (
    <ProgressRing progress={progress} className="size-11">
      <button type="button" aria-label={stopped ? copy.play : copy.pause} onClick={() => setStopped((s) => !s)} className={icon}>
        {stopped ? <Play className="size-3.5 fill-current" aria-hidden /> : <Pause className="size-3.5 fill-current" aria-hidden />}
      </button>
    </ProgressRing>
  );

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
        className={clsx("on-dark fixed bottom-4 left-4 z-30 touch-none select-none bg-transparent!", className)}
      >
        <AnimatePresence mode="wait" initial={false}>
          {min ? (
            <motion.div key="bubble" {...pop} className="origin-bottom-left">
              <button type="button" onClick={() => toggleMin(false)} onKeyDown={onKey} aria-label={copy.expand(product.name)} aria-expanded={false}
                className="block size-12 rounded-pill shadow-lg transition-transform duration-(--dur-base) ease-soft hover:scale-105 md:size-16">
                <ProgressRing progress={progress} className="size-full rounded-pill bg-black">
                  <span className="relative size-10 overflow-hidden rounded-pill md:size-13">
                    <AnimatePresence initial={false}>
                      <motion.span key={product.id} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={t()}>
                        <ImageWell media={media} alt="" sizes="52px" className="size-full" />
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </ProgressRing>
              </button>
            </motion.div>
          ) : (
            <motion.div key="card" {...pop}
              className="relative isolate w-80 max-w-[calc(100vw-2rem)] origin-bottom-left overflow-hidden rounded-xl border border-line bg-black shadow-lg">
              <AnimatePresence initial={false}>
                <motion.div key={product.id} className="absolute inset-0 -z-10" aria-hidden
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={reduce ? { duration: 0 } : { duration: 0.8 }}>
                  <Glow media={media} />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/90 via-black/60 to-black/25" aria-hidden />

              <div className="flex items-center gap-0.5 pr-1">
                <button type="button" aria-label={copy.move} onKeyDown={onKey}
                  className={clsx(icon, "cursor-grab active:cursor-grabbing")}>
                  <GripVertical className="size-4" aria-hidden />
                </button>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={`${product.id}-k`} {...rise(0)} exit={{ opacity: 0 }}><KindBadge kind={kind} /></motion.span>
                </AnimatePresence>
                <span className="t-index ml-auto whitespace-nowrap pr-1 text-ink-soft max-sm:invisible" aria-hidden>{counter}</span>
                <button type="button" aria-label={copy.minimise} aria-expanded onClick={() => toggleMin(true)} className={icon}><Minus className="size-4" aria-hidden /></button>
                <button type="button" aria-label={copy.close} onClick={dismiss} className={icon}><X className="size-4" aria-hidden /></button>
              </div>

              <div className="group relative flex items-center gap-4 px-4 pb-4 pt-1" {...tilt.handlers}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={product.id} className="flex min-w-0 flex-1 items-center gap-4"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: reduce ? 0 : -12 }} transition={t()}>
                    <motion.div {...rise(0)}><FloatingShot media={media} tilt={tilt.style} /></motion.div>
                    <div className="min-w-0 flex-1">
                      {/* Stretched button: the whole stage opens Quick View (a <p> price can't live inside a <button>).
                          No transformed ancestor up to the stage, or the overlay would shrink to that box. */}
                      <button type="button" onClick={() => openQuickView(product)} aria-label={quickViewCopy.open(product.name)}
                        className="text-left font-display text-body-lg font-semibold leading-tight text-ink after:absolute after:inset-0 after:content-['']">
                        <motion.span {...rise(0.06)} className="line-clamp-2">{product.name}</motion.span>
                      </button>
                      <motion.div {...rise(0.12)}><PriceTag price={product.priceFrom} compareAt={product.compareAtFrom} className="mt-1" /></motion.div>
                      <motion.span {...rise(0.18)} aria-hidden
                        className="mt-2.5 inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill bg-on-dark px-3 py-1 text-micro font-medium text-black transition-transform duration-(--dur-base) ease-soft group-hover:scale-105">
                        <Eye className="size-3.5" aria-hidden />{quickViewCopy.label}
                      </motion.span>
                    </div>
                  </motion.div>
                </AnimatePresence>
                {playPause && <div className="relative self-end">{playPause}</div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </>
  );
}
