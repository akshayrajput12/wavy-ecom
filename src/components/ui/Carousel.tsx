"use client";

import { clsx } from "clsx";
import { useReducedMotion } from "./useMediaQuery";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Children, useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { uiCopy } from "@/data/copy";

type PerView = { base: number; sm?: number; lg?: number };

/** Distance between two slide starts (slide width + gap). */
function stepOf(el: HTMLElement) {
  const first = el.querySelector("li");
  return (first?.getBoundingClientRect().width ?? el.clientWidth) + (Number.parseFloat(getComputedStyle(el).columnGap) || 0) || 1;
}

export type CarouselProps = {
  children: ReactNode;
  /** Accessible name of the carousel region, e.g. "Featured offers". */
  label: string;
  /** Slides visible per breakpoint (fractions give a "peek"). Default `{ base: 1 }`. */
  perView?: PerView;
  /** Gap between slides, any CSS length or token. Default `var(--space-4)`. */
  gap?: string;
  /** Autoplay interval in ms; pauses on hover / focus / hidden tab and has a visible pause button. */
  autoplay?: number;
  dots?: boolean;
  arrows?: boolean;
  /** "sides": floating arrows over the track (default). "end": small circles under it, bottom-right (product rails). */
  arrowsAt?: "sides" | "end";
  /** Pull the scroller to the page edge (rails inside `.container-x`). */
  bleed?: boolean;
  className?: string;
};

/** Scroll-snap carousel: native touch swipe, mouse drag, keyboard scroll, prev/next, dots, optional autoplay. */
export function Carousel({ children, label, perView = { base: 1 }, gap = "var(--space-4)", autoplay, dots = false, arrows = true, arrowsAt = "sides", bleed, className }: CarouselProps) {
  const slides = Children.toArray(children);
  const ref = useRef<HTMLUListElement>(null);
  const reduce = useReducedMotion();
  const [state, setState] = useState({ index: 0, pages: slides.length, atStart: true, atEnd: slides.length <= 1 });
  const pos = useRef(state);
  const [hover, setHover] = useState(false);
  const [paused, setPaused] = useState(false);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const s = stepOf(el);
    const visible = Math.max(1, Math.round(el.clientWidth / s));
    pos.current = {
      index: Math.round(el.scrollLeft / s),
      pages: Math.max(1, slides.length - visible + 1),
      atStart: el.scrollLeft <= 2,
      atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
    };
    setState(pos.current);
  }, [slides.length]);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const goTo = useCallback((i: number) => {
    const el = ref.current;
    el?.scrollTo({ left: i * stepOf(el), behavior: reduce ? "auto" : "smooth" });
  }, [reduce]);

  const running = !!autoplay && !reduce && !paused && !hover;
  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => {
      if (document.hidden) return;
      goTo(pos.current.atEnd ? 0 : pos.current.index + 1);
    }, autoplay);
    return () => window.clearInterval(t);
  }, [running, autoplay, goTo]);

  // Mouse drag only: touch and pen already swipe natively via overflow scroll.
  const onPointerDown = (e: PointerEvent<HTMLUListElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || !ref.current) return;
    drag.current = { x: e.clientX, left: ref.current.scrollLeft, moved: false };
  };
  const onPointerMove = (e: PointerEvent<HTMLUListElement>) => {
    const d = drag.current;
    const el = ref.current;
    if (!d || !el) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) < 5) return;
    if (!d.moved) {
      d.moved = true;
      el.setPointerCapture(e.pointerId);
      el.style.scrollSnapType = "none";
    }
    el.scrollLeft = d.left - dx;
  };
  const endDrag = () => {
    const d = drag.current;
    const el = ref.current;
    drag.current = null;
    if (!d?.moved || !el) return;
    el.style.scrollSnapType = "";
    goTo(Math.round(el.scrollLeft / stepOf(el)));
    // swallow the click that follows a drag so slide links don't fire
    const swallow = (ev: MouseEvent) => ev.preventDefault();
    el.addEventListener("click", swallow, { capture: true, once: true });
    window.setTimeout(() => el.removeEventListener("click", swallow, { capture: true }));
  };

  const vars = { "--gap": gap, "--pv-base": perView.base, "--pv-sm": perView.sm, "--pv-lg": perView.lg } as CSSProperties;
  const arrowBtn = "absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-pill bg-surface/90 text-ink shadow-md backdrop-blur-xs transition-[opacity,background-color] hover:bg-surface disabled:pointer-events-none disabled:opacity-0 sm:grid";

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      className={clsx("relative", className)}
      style={vars}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setHover(false)}
    >
      <ul
        ref={ref}
        tabIndex={0}
        aria-live={running ? "off" : "polite"}
        onScroll={measure}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={clsx(
          "relative flex snap-x snap-mandatory gap-(--gap) overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "[--pv:var(--pv-base)] sm:[--pv:var(--pv-sm,var(--pv-base))] lg:[--pv:var(--pv-lg,var(--pv-sm,var(--pv-base)))]",
          "rounded-md focus-visible:outline-offset-4",
          bleed && "-mx-(--gutter) scroll-px-(--gutter) px-(--gutter)",
        )}
      >
        {slides.map((slide, i) => (
          <li
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={uiCopy.slideOf(i + 1, slides.length)}
            className="w-[calc((100%_-_(var(--pv)_-_1)_*_var(--gap))_/_var(--pv))] min-w-0 shrink-0 snap-start [&_a]:select-none [&_img]:pointer-events-none"
          >
            {slide}
          </li>
        ))}
      </ul>

      {arrows && arrowsAt === "end" && !(state.atStart && state.atEnd) && (
        <div className="mt-6 flex justify-end gap-2">
          {/* active = ink filled, inactive = outlined (reference rail) */}
          {([[uiCopy.prevSlide, -1, state.atStart, ChevronLeft], [uiCopy.nextSlide, 1, state.atEnd, ChevronRight]] as const).map(([name, d, off, Icon]) => (
            <button key={d} type="button" aria-label={name} onClick={() => goTo(state.index + d)} disabled={off}
              className={clsx("grid size-11 place-items-center rounded-pill border transition-colors duration-(--dur-fast)", off ? "border-line text-ink-muted" : "border-ink bg-ink text-canvas hover:bg-ink/85")}>
              <Icon className="size-4" aria-hidden />
            </button>
          ))}
        </div>
      )}
      {arrows && arrowsAt === "sides" && slides.length > 1 && (
        <>
          <button type="button" aria-label={uiCopy.prevSlide} onClick={() => goTo(state.index - 1)} disabled={state.atStart} className={clsx(arrowBtn, "left-3")}>
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button type="button" aria-label={uiCopy.nextSlide} onClick={() => goTo(state.index + 1)} disabled={state.atEnd} className={clsx(arrowBtn, "right-3")}>
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </>
      )}

      {(dots || autoplay) && state.pages > 1 && (
        <div className="mt-3 flex items-center justify-center">
          {autoplay && !reduce && (
            <button type="button" onClick={() => setPaused((p) => !p)} aria-label={paused ? uiCopy.play : uiCopy.pause} className="grid size-11 place-items-center rounded-pill text-ink-soft transition-colors hover:text-ink">
              {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
            </button>
          )}
          {dots && Array.from({ length: state.pages }, (_, i) => (
            <button key={i} type="button" onClick={() => goTo(i)} aria-label={uiCopy.goToSlide(i + 1)} aria-current={i === state.index || undefined} className="group grid h-11 w-7 place-items-center">
              <span className={clsx("h-1.5 rounded-pill transition-all duration-(--dur-base)", i === state.index ? "w-5 bg-ink" : "w-1.5 bg-line group-hover:bg-ink-muted")} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
