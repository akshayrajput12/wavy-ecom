"use client";

import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore, type Dispatch, type FocusEvent, type PointerEvent, type RefObject, type SetStateAction, type WheelEvent } from "react";

/** A play/pause state owned by a parent, so it survives the rail remounting. */
export type PlayState = [boolean, Dispatch<SetStateAction<boolean>>];

const INTERVAL_MS = 4000;
const IDLE_MS = 8000; // pause after the shopper drags, wheels, presses a key or uses the arrows

const onVisibility = (cb: () => void) => { document.addEventListener("visibilitychange", cb); return () => document.removeEventListener("visibilitychange", cb); };

/**
 * Auto-advance for HomeRail: calls `advance` every 4s while `enabled`, playing (user toggle), on screen, the tab is
 * visible and the rail is neither hovered nor focused. `nudge()` (and the returned handlers) hold it for 8s.
 */
export function useRailAutoplay(ref: RefObject<HTMLElement | null>, advance: () => void, enabled: boolean, playState?: PlayState) {
  const own = useState(true);
  const [playing, setPlaying] = playState ?? own;
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const tabHidden = useSyncExternalStore(onVisibility, () => document.visibilityState === "hidden", () => false);
  const idleUntil = useRef(0);
  const tick = useEffectEvent(() => { if (Date.now() >= idleUntil.current) advance(); });
  const active = enabled && playing && !hover && !focus && onScreen && !tabHidden;

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, enabled]);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(tick, INTERVAL_MS);
    return () => clearInterval(id);
  }, [active]);

  const nudge = () => { idleUntil.current = Date.now() + IDLE_MS; };
  const handlers = {
    onPointerEnter: (e: PointerEvent) => { if (e.pointerType === "mouse") setHover(true); },
    onPointerLeave: () => setHover(false),
    onPointerDown: nudge,
    onKeyDown: nudge,
    // vertical wheel over the rail is page scroll, not carousel interaction
    onWheel: (e: WheelEvent) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) nudge(); },
    onFocus: () => setFocus(true),
    onBlur: (e: FocusEvent) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocus(false); },
  };
  return { playing, toggle: () => setPlaying((p) => !p), nudge, handlers };
}
