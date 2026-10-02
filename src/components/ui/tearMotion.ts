"use client";

import { useMotionValueEvent, useScroll } from "framer-motion";
import { useEffect, useRef, type PointerEvent, type RefObject } from "react";
import { TIGER_SCALE, eyeAttrs, type EyePose } from "./TearArt";
import { CX, EDGE_DONE, EYES, clamp01, easeOutBack, edgeShapes, pathD, pieceMotion, rng, stages, tearLine, type Pt } from "./tearGeometry";

export const LINE = tearLine();
/** viewBox units -> CSS px. `--u` is set on the stage (a size container) to its px-per-unit. */
const u = (n: number) => `calc(${n.toFixed(2)} * var(--u))`;
const piece = ({ dx, dy, rot }: { dx: number; dy: number; rot: number }) => `translate(${u(dx)}, ${u(dy)}) rotate(${rot.toFixed(3)}deg)`;

/** Every scroll-driven style at one progress. The first render and the scroll handler both use it, so they always agree. */
export function tearPose(p: number, photo: boolean) {
  const s = stages(p);
  const m = pieceMotion(s.open, photo ? s.clear : 0);
  const shake = Math.sin(p * 900) * 6 * s.shake;
  const crack = s.crack > 0 && s.open < 0.15 ? LINE.filter(([x]) => Math.abs(x - CX) <= s.crack * 620) : [];
  return {
    s,
    shake: `translate(${u(shake)}, ${u(shake * 0.4)})`,
    tiger: `translateY(${u((1 - s.rise) * 150)}) scale(${((1.34 - 0.06 * s.rise) / TIGER_SCALE).toFixed(4)})`,
    top: piece(m.top),
    bottom: piece(m.bottom),
    photo: `scale(${(1.12 - 0.12 * (0.35 * s.open + 0.65 * s.clear)).toFixed(4)})`,
    hint: Math.max(0, 0.7 - s.crack * 3),
    crack: crack.length > 1 ? pathD(crack, false) : "",
    crackOpacity: 1 - s.open / 0.15,
    done: photo ? s.clear > 0.95 : s.pop > 0.95,
  };
}

/** The eyes at one progress: shut until the tiger is up, then a blink or squint on top. */
export function eyePose(p: number, look: Pt = [0, 0], blink = 0, squint = 0): EyePose {
  const pop = stages(p).pop;
  const e = easeOutBack(pop);
  return { look, blink: Math.max(1 - clamp01(e), blink, squint * 0.45), pupil: 1.3 - 0.5 * pop + 0.35 * squint, scale: 0.9 + 0.1 * e };
}

type El = HTMLElement | SVGElement;
const set = (el: Element | null | undefined, name: string, v: string) => { if (el && el.getAttribute(name) !== v) el.setAttribute(name, v); };

/**
 * Drives TearReveal without re-rendering it. Progress is the section's scroll position, 1:1 (Lenis already eases the
 * wheel, so no second smoothing): framer's useScroll -> a handful of style/attribute writes per frame. The halves and
 * tiger are their own composited layers, so scrolling moves pixels instead of repainting the art. A separate rAF loop
 * (only while on screen) animates the eyes.
 */
export function useTearMotion({ root, stage, progress, photo, enabled }: {
  root: RefObject<HTMLElement | null>; stage: RefObject<HTMLDivElement | null>; progress?: number; photo: boolean; enabled: boolean;
}) {
  const { scrollYProgress } = useScroll({ target: root, offset: ["start start", "end end"] });
  const pRef = useRef(clamp01(progress ?? 0));
  const progressRef = useRef(progress);
  const paint = useRef<(p: number) => void>(() => {});
  const want = useRef<Pt | null>(null);
  const squintAt = useRef(-1e9);

  useEffect(() => {
    const el = stage.current;
    if (!enabled || !el) return;
    const q = (k: string) => el.querySelector<El>(`[data-tr="${k}"]`);
    const n = { shake: q("shake"), tiger: q("tiger"), top: q("top"), bottom: q("bottom"), whole: q("whole"), crack: q("crack"), photo: q("photo"), hint: q("hint"), cta: q("cta") };
    let edge = -1;
    paint.current = (p) => {
      pRef.current = p;
      const t = tearPose(p, photo);
      for (const k of ["shake", "tiger", "top", "bottom", "photo"] as const) if (n[k]) n[k].style.transform = t[k];
      if (n.whole) n.whole.style.visibility = t.s.open > 0 ? "hidden" : "";
      set(n.crack, "d", t.crack || "M0 0");
      set(n.crack, "opacity", t.crack ? t.crackOpacity.toFixed(3) : "0");
      if (n.hint) n.hint.style.opacity = t.hint.toFixed(3);
      if (n.cta instanceof HTMLElement) { n.cta.inert = !t.done; n.cta.style.opacity = t.done ? "1" : "0"; }
      el.style.cursor = !photo && t.s.pop > 0.9 ? "crosshair" : "";
      const e = Math.min(t.s.open, EDGE_DONE);
      if (e === edge) return;
      edge = e;
      for (const side of ["top", "bottom"] as const) {
        const shape = edgeShapes(side, LINE, e);
        set(n[side]?.querySelector("[data-tr=shadow]"), "stroke-opacity", shape.shadow.toFixed(3));
        set(n[side]?.querySelector("[data-tr=core]"), "d", shape.core);
        n[side]?.querySelectorAll("[data-tr=curl]").forEach((c, i) => set(c, "d", shape.curls[i]));
      }
    };
    paint.current(progressRef.current === undefined ? scrollYProgress.get() : clamp01(progressRef.current));
    return () => { paint.current = () => {}; };
  }, [enabled, photo, scrollYProgress, stage]);

  useMotionValueEvent(scrollYProgress, "change", (v) => { if (progressRef.current === undefined) paint.current(v); });
  useEffect(() => {
    progressRef.current = progress;
    if (progress !== undefined) paint.current(clamp01(progress));
  }, [progress]);

  // the eyes: look at the pointer (or wander), blink every few seconds, squint when poked
  useEffect(() => {
    const el = stage.current;
    if (!enabled || photo || !el) return;
    const eyes = [...el.querySelectorAll("[data-tr=eye]")].map((g, i) => ({
      g, i, iris: g.querySelector("[data-tr=iris]"), lid: g.querySelector("[data-tr=lid]"), pupil: g.querySelector("[data-tr=pupil]"),
    }));
    let raf = 0;
    let visible = false;
    let look: Pt = [0, 0];
    let idle: Pt = [0, 0];
    let nextIdle = 0;
    let nextBlink = performance.now() + 2500;
    let prev = performance.now();
    const tick = (now: number) => {
      raf = 0;
      if (!visible) return;
      const dt = Math.min(64, now - prev);
      prev = now;
      if (!want.current && now > nextIdle) {
        const g = rng(Math.floor(now));
        idle = [(g() - 0.5) * 1.4, (g() - 0.5) * 0.8];
        nextIdle = now + 1400 + g() * 1800;
      }
      const to = want.current ?? idle;
      const k = 1 - Math.pow(0.86, dt / 16.7); // the same 0.14 per frame at 60Hz, frame-rate independent
      look = [look[0] + (to[0] - look[0]) * k, look[1] + (to[1] - look[1]) * k];
      const since = now - nextBlink;
      const blink = since <= 0 ? 0 : since < 90 ? since / 90 : since < 200 ? 1 - (since - 90) / 110 : 0;
      if (since > 200) nextBlink = now + 2600 + Math.random() * 3200;
      const pose = eyePose(pRef.current, look, blink, Math.max(0, 1 - (now - squintAt.current) / 900));
      for (const e of eyes) {
        const a = eyeAttrs(EYES[e.i], e.i === 0, pose);
        set(e.g, "transform", a.eye);
        set(e.iris, "transform", a.iris);
        set(e.lid, "transform", a.lid);
        set(e.pupil, "r", a.pupil);
      }
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) { prev = performance.now(); raf = requestAnimationFrame(tick); }
    });
    io.observe(el);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [enabled, photo, stage]);

  return {
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      want.current = [
        Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / (r.width * 0.35))),
        Math.max(-1, Math.min(1, (e.clientY - r.top - r.height * 0.58) / (r.height * 0.35))),
      ];
    },
    onPointerLeave: () => { want.current = null; },
    onPointerDown: () => { if (stages(pRef.current).pop > 0.5) squintAt.current = performance.now(); },
  };
}
