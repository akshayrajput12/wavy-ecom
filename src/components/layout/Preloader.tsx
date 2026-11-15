"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { lockScroll } from "@/components/providers/SmoothScroll";
import { preloaderCopy } from "@/data/storefront";
import { PRELOADED_KEY } from "@/lib/site";
import { BrandImage } from "./Logo";

// Timeline in ms; globals.css (.preloader-*) reads these through --pl-hold / --pl-exit. Total 2.4s.
const HOLD = 1600; // wordmark sits, curtain holds
const EXIT = 800; // content fades, curtain splits top/bottom

export function Preloader({ storeName, logoUrl }: { storeName: string; logoUrl?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const el = ref.current;
    try {
      sessionStorage.setItem(PRELOADED_KEY, "1");
    } catch {
      /* storage blocked */
    }
    const hide = () => root.setAttribute("data-preloaded", "");
    if (!el || root.hasAttribute("data-preloaded") || matchMedia("(prefers-reduced-motion: reduce)").matches)
      return hide();

    const unlock = lockScroll();
    let ended = false;
    const finish = () => {
      if (ended) return;
      ended = true;
      hide();
      unlock();
      // Tell the vibe player the curtain has dropped so the track stops.
      window.dispatchEvent(new Event("wavy:preloader-done"));
    };
    const anims = el.getAnimations({ subtree: true });
    Promise.all(anims.map((a) => a.finished)).then(finish, finish);

    const skip = () => {
      anims.forEach((a) => {
        if (typeof a.currentTime === "number" && a.currentTime < HOLD) a.currentTime = HOLD;
      });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
    };
    el.addEventListener("click", skip);
    window.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("click", skip);
      window.removeEventListener("keydown", onKey);
      if (!ended) {
        ended = true;
        unlock();
      }
    };
  }, []);

  const timing = { "--pl-hold": `${HOLD}ms`, "--pl-exit": `${EXIT}ms` } as CSSProperties;
  return (
    <div ref={ref} className="preloader" style={timing}>
      <p role="status" className="sr-only">
        {preloaderCopy.status(storeName)}
      </p>
      <div aria-hidden className="preloader-cover">
        <span className="preloader-panel preloader-panel-top" />
        <span className="preloader-panel preloader-panel-bottom" />
        <div className="preloader-content">
          {/* Main Brand Wordmark */}
          <span className="preloader-word">
            {logoUrl ? (
              <BrandImage src={logoUrl} alt="" className="h-14 sm:h-20" />
            ) : (
              Array.from(storeName).map((ch, i) => (
                <span key={i} className="preloader-rise" style={{ "--i": i } as CSSProperties}>
                  {ch}
                </span>
              ))
            )}
          </span>

          {/* Tagline */}
          <p className="preloader-tagline">mahol pura wavy</p>
        </div>
      </div>
    </div>
  );
}