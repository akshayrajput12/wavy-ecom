"use client";

import { useRef, type PointerEvent, type RefObject } from "react";

/**
 * Mouse drag-to-scroll for a native horizontal scroller (touch/pen already swipe natively).
 * Snap is suspended while dragging; the click that ends a drag is swallowed so links don't fire.
 */
export function useDragScroll(ref: RefObject<HTMLElement | null>) {
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || !ref.current) return;
    drag.current = { x: e.clientX, left: ref.current.scrollLeft, moved: false };
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
  };
  const end = () => {
    const d = drag.current;
    const el = ref.current;
    drag.current = null;
    if (!d?.moved || !el) return;
    el.style.scrollSnapType = "";
    const swallow = (ev: MouseEvent) => ev.preventDefault();
    el.addEventListener("click", swallow, { capture: true, once: true });
    window.setTimeout(() => el.removeEventListener("click", swallow, { capture: true }));
  };

  return { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end };
}
