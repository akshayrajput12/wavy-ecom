"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { lockScroll } from "@/components/providers/SmoothScroll";
import { preloaderCopy } from "@/data/storefront";
import { PRELOADED_KEY } from "@/lib/site";
import { BrandImage } from "./Logo";

// Timeline in ms; globals.css (.preloader-*) reads these through --pl-hold / --pl-exit. Total 2.1s.
const HOLD = 1300; // letters rise through the mask, counter 00 → 100
const EXIT = 800; // content fades, curtain splits top/bottom

/**
 * First-visit storefront preloader (once per session). Server-rendered and animated in CSS, so it plays from first
 * paint, before hydration, and clears itself even if JS never runs; the page renders underneath the whole time.
 * JS only locks scroll, records the session flag, skips on click / Escape and hides it when the curtain is gone.
 * Returning visits: the root layout's inline script sets <html data-preloaded> before paint, and CSS hides it.
 */
export function Preloader({ storeName, logoUrl }: { storeName: string; logoUrl?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const el = ref.current;
    try { sessionStorage.setItem(PRELOADED_KEY, "1"); } catch { /* storage blocked: it plays again next load */ }
    const hide = () => root.setAttribute("data-preloaded", "");
    if (!el || root.hasAttribute("data-preloaded") || matchMedia("(prefers-reduced-motion: reduce)").matches) return hide();

    const unlock = lockScroll();
    let ended = false;
    const finish = () => { if (ended) return; ended = true; hide(); unlock(); };
    const anims = el.getAnimations({ subtree: true });
    // a cancelled animation rejects `finished`; either way the cover is done
    Promise.all(anims.map((a) => a.finished)).then(finish, finish);

    // skip = jump every animation to the start of the exit, so the curtain still opens
    const skip = () => anims.forEach((a) => { if (typeof a.currentTime === "number" && a.currentTime < HOLD) a.currentTime = HOLD; });
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") skip(); };
    el.addEventListener("click", skip);
    window.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("click", skip);
      window.removeEventListener("keydown", onKey);
      if (!ended) { ended = true; unlock(); }
    };
  }, []);

  const timing = { "--pl-hold": `${HOLD}ms`, "--pl-exit": `${EXIT}ms` } as CSSProperties;
  return (
    <div ref={ref} className="preloader" style={timing}>
      <p role="status" className="sr-only">{preloaderCopy.status(storeName)}</p>
      <div aria-hidden className="preloader-cover text-on-dark">
        <span className="preloader-panel preloader-panel-top" />
        <span className="preloader-panel preloader-panel-bottom" />
        <div className="preloader-content">
          <span className="preloader-word">
            {logoUrl ? (
              <span className="preloader-rise"><BrandImage src={logoUrl} alt="" className="h-14 sm:h-20" /></span>
            ) : (
              Array.from(storeName).map((ch, i) => (
                <span key={i} className="preloader-rise" style={{ "--i": i } as CSSProperties}>{ch}</span>
              ))
            )}
          </span>
          <span className="flex w-48 items-center gap-3">
            <span className="h-px flex-1 bg-on-dark/20"><span className="preloader-fill" /></span>
            <span className="preloader-count t-index text-on-dark-soft" />
          </span>
        </div>
      </div>
    </div>
  );
}
