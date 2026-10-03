"use client";

import { animate, type AnimationPlaybackControls } from "framer-motion";
import { useRef, type PointerEvent, type RefObject } from "react";
import { useReducedMotion } from "@/components/ui/useMediaQuery";

/** Distance between snap points: the first item's width + the flex gap. */
export function itemStep(el: HTMLElement) {
  const w = el.querySelector("li")?.getBoundingClientRect().width ?? el.clientWidth;
  return w + (Number.parseFloat(getComputedStyle(el).columnGap) || 0) || 1;
}

/**
 * Mouse drag-to-scroll for a native horizontal scroller (touch/pen swipe, trackpads and arrow keys stay native).
 * Snap is suspended while dragging; on release the rail glides on with the throw's momentum and settles exactly on
 * the nearest item (`itemStep`), then CSS snap resumes. Reduced motion: no glide, CSS snap settles it.
 * The click that ends a drag is swallowed (never reaches the link's handlers) so cards don't open.
 */
export function useDragScroll(ref: RefObject<HTMLElement | null>) {
  const reduce = useReducedMotion();
  const drag = useRef<{ x: number; left: number; moved: boolean; lastX: number; t: number; v: number } | null>(null);
  const glide = useRef<AnimationPlaybackControls | null>(null);

  const stop = () => {
    glide.current?.stop();
    glide.current = null;
    if (ref.current) ref.current.style.scrollSnapType = "";
  };
  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || !ref.current) return;
    stop(); // grabbing a gliding rail catches it
    drag.current = { x: e.clientX, left: ref.current.scrollLeft, moved: false, lastX: e.clientX, t: e.timeStamp, v: 0 };
  };
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
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
    const dt = e.timeStamp - d.t;
    if (dt > 0) d.v = 0.8 * (((e.clientX - d.lastX) / dt) * 1000) + 0.2 * d.v; // smoothed px/s
    d.lastX = e.clientX;
    d.t = e.timeStamp;
  };
  const end = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    const el = ref.current;
    drag.current = null;
    if (!d?.moved || !el) return;
    const swallow = (ev: MouseEvent) => { ev.preventDefault(); ev.stopPropagation(); };
    el.addEventListener("click", swallow, { capture: true, once: true });
    window.setTimeout(() => el.removeEventListener("click", swallow, { capture: true }));
    if (reduce) return void (el.style.scrollSnapType = "");
    const step = itemStep(el);
    const v = e.timeStamp - d.t > 80 ? 0 : -d.v; // held still before letting go = no throw
    glide.current = animate(el.scrollLeft, el.scrollLeft, {
      type: "inertia", velocity: v, power: 0.35, timeConstant: 320, min: 0, max: el.scrollWidth - el.clientWidth,
      bounceStiffness: 320, bounceDamping: 36, modifyTarget: (t) => Math.round(t / step) * step,
      onUpdate: (left) => { el.scrollLeft = left; },
      onComplete: stop,
    });
  };

  return { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end, onWheel: () => glide.current && stop() };
}
