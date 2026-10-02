"use client";

import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/components/ui/useMediaQuery";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useId, useRef, useState, type PointerEvent } from "react";
import { homeCopy, homeStageCopy as copy } from "@/data/storefront";
import type { HomeSectionOf } from "@/types/domain";
import { HeadingLines } from "./HeadingLines";
import { useDragScroll } from "./useDragScroll";

const pad = (n: number) => String(n).padStart(2, "0");
const circle = "grid size-11 place-items-center rounded-pill border border-line text-ink transition-colors hover:border-ink hover:bg-ink hover:text-canvas disabled:pointer-events-none disabled:opacity-40";
const step = (el: HTMLElement) => (el.querySelector("li")?.getBoundingClientRect().width ?? el.clientWidth) + 2 || 1; // + gap-0.5

/** "In the wild" lookbook: dark stage, edge-to-edge desaturated panels on native scroll + snap, mouse drag, caption bar. */
export function CollectionRail({ section }: { section: HomeSectionOf<"collection_rail"> }) {
  const items = section.collections;
  const headingId = useId();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLUListElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);
  const [pillOn, setPillOn] = useState(false);
  const drag = useDragScroll(ref);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
    setActive(atEnd && el.scrollLeft > 2 ? items.length - 1 : Math.round(el.scrollLeft / step(el)));
  }, [items.length]);
  const goTo = (i: number) => {
    const el = ref.current;
    const next = Math.min(Math.max(0, i), items.length - 1);
    setActive(next); // panels that can't scroll further (end of rail) still become active
    el?.scrollTo({ left: next * step(el), behavior: reduce ? "auto" : "smooth" });
  };
  // custom cursor pill: mouse only, never for reduced motion; positioned without re-rendering
  const movePill = (e: PointerEvent<HTMLDivElement>) => {
    const p = pill.current;
    if (!p || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    p.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px) translate(-50%, -50%)`;
  };

  if (!items.length) return null;
  const current = items[Math.min(active, items.length - 1)];
  const showPill = pillOn && !reduce;

  return (
    <section aria-labelledby={headingId} className="on-dark section-y">
      <div className="container-x flex items-end justify-between gap-6 pb-8 lg:pb-12">
        <div>
          <p className="t-overline">{section.subtitle ?? copy.lookbookOverline}</p>
          <HeadingLines id={headingId} line={section.title ?? homeCopy.slideshow} className="mt-4" />
        </div>
        <p className="t-overline shrink-0">{copy.lookbookCount(items.length)}</p>
      </div>

      <div className="relative" onPointerMove={movePill}
        onPointerEnter={(e) => e.pointerType === "mouse" && setPillOn(true)} onPointerLeave={() => setPillOn(false)}>
        <ul ref={ref} tabIndex={0} aria-labelledby={headingId} onScroll={measure} {...drag}
          className={clsx(
            "flex snap-x snap-proximity gap-0.5 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "focus-visible:outline-offset-[-4px] [&_a]:select-none [&_img]:pointer-events-none",
            showPill && "cursor-none",
          )}>
          {items.map((c, i) => (
            <li key={c.id} className="h-[min(72svh,40rem)] shrink-0 grow basis-[72vw] snap-start sm:basis-[44vw] lg:basis-[22vw]">
              <Link href={`/collections/${c.slug}`} draggable={false} onFocus={() => setActive(i)}
                className="group relative block size-full overflow-hidden bg-black-2 focus-visible:outline-offset-[-4px]">
                {c.image?.url && (
                  <Image src={c.image.url} alt={c.image.alt} fill draggable={false} sizes="(min-width: 1024px) 22vw, (min-width: 640px) 44vw, 72vw"
                    className={clsx(
                      "object-cover transition-[filter,scale] duration-(--dur-slow) ease-soft group-hover:scale-[1.03] group-hover:grayscale-0",
                      i === active ? "grayscale-0" : "grayscale",
                    )} />
                )}
                <span className="sr-only">{c.name}{c.productCount ? `, ${homeCopy.products(c.productCount)}` : ""}</span>
              </Link>
            </li>
          ))}
        </ul>
        <span ref={pill} aria-hidden
          className={clsx(
            "t-overline pointer-events-none absolute left-0 top-0 z-10 flex items-center gap-2 rounded-pill border border-line bg-surface/80 px-4 py-2 text-ink backdrop-blur-sm transition-opacity duration-(--dur-fast)",
            showPill ? "opacity-100" : "opacity-0",
          )}>
          <ChevronLeft className="size-3" />{copy.drag}<ChevronRight className="size-3" />
        </span>
      </div>

      <div className="container-x flex items-center justify-between gap-6 pt-6">
        {/* caption cross-fades up as the active panel changes */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={current.id} className="min-w-0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
            <p className="t-h2 truncate">{current.name}</p>
            {current.productCount ? <p className="t-overline mt-1">{homeCopy.products(current.productCount)}</p> : null}
          </motion.div>
        </AnimatePresence>
        <div className="flex shrink-0 items-center gap-2">
          <p className="t-index mr-2 text-ink-soft" aria-hidden><span className="text-ink">{pad(active + 1)}</span> / {pad(items.length)}</p>
          <button type="button" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label={copy.prevCollection} className={circle}>
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button type="button" onClick={() => goTo(active + 1)} disabled={active >= items.length - 1} aria-label={copy.nextCollection} className={circle}>
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
