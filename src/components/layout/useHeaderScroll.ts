"use client";

import { useEffect, useState, type RefObject } from "react";

const HIDE_AFTER = 160;
const DELTA = 6;

/**
 * True when the page content under the pill's vertical centre sits inside a `.on-dark` stage.
 * offsetTop ignores transforms, so the probe stays put while the header is slid away.
 */
function overDarkStage(pill: HTMLElement) {
  const header = pill.offsetParent instanceof HTMLElement ? pill.offsetParent.offsetTop : 0;
  const y = header + pill.offsetTop + pill.offsetHeight / 2;
  const under = document.elementsFromPoint(window.innerWidth / 2, y).find((el) => !pill.contains(el));
  return Boolean(under?.closest(".on-dark"));
}

/**
 * Scroll state for the floating header: `hidden` while scrolling down (shows again on scroll up),
 * `dark` while a dark stage is beneath the pill. rAF-throttled; re-evaluated on every route (`routeKey`).
 */
export function useHeaderScroll(pillRef: RefObject<HTMLElement | null>, initialDark: boolean, routeKey: string) {
  const [hidden, setHidden] = useState(false);
  const [dark, setDark] = useState(initialDark);

  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      // compare against the last *accepted* position so slow (Lenis) scrolling still accumulates
      if (Math.abs(y - last) > DELTA) {
        setHidden(y > last && y > HIDE_AFTER);
        last = y;
      }
      if (pillRef.current) setDark(overDarkStage(pillRef.current));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [pillRef, routeKey]);

  return { hidden, dark, show: () => setHidden(false) };
}
