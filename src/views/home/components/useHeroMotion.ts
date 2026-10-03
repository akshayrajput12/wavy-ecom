"use client";

import { animate, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useSyncExternalStore, type PointerEvent, type RefObject } from "react";
import { useMediaQuery, useReducedMotion } from "@/components/ui/useMediaQuery";

/** `document.hidden`, live (false on the server and while hydrating). */
export function usePageHidden() {
  return useSyncExternalStore(
    (cb) => {
      document.addEventListener("visibilitychange", cb);
      return () => document.removeEventListener("visibilitychange", cb);
    },
    () => document.hidden,
    () => false,
  );
}

/**
 * Autoplay timer as a MotionValue 0 -> 1, so the progress bar fills without re-renders. Resets on every slide change,
 * freezes while `running` is false and resumes where it stopped; calls `onDone` (next slide) when it fills.
 */
export function useAutoplayProgress(running: boolean, ms: number, slide: number, onDone: () => void) {
  const progress = useMotionValue(0);
  useEffect(() => progress.set(0), [slide, progress]);
  useEffect(() => {
    if (!running) return;
    const c = animate(progress, 1, { duration: (ms / 1000) * (1 - progress.get()), ease: "linear", onComplete: onDone });
    return () => c.stop();
  }, [running, ms, slide, progress, onDone]);
  return progress;
}

const SPRING = { stiffness: 60, damping: 20, mass: 0.8 };

/** Desktop-only pointer parallax: the media leans toward the cursor, the ambient backdrop drifts away from it. */
export function usePointerParallax() {
  const fine = useMediaQuery("(pointer: fine) and (min-width: 1024px)");
  const reduce = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, SPRING);
  const sy = useSpring(py, SPRING);
  const media = { x: useTransform(sx, (v) => v * 8), y: useTransform(sy, (v) => v * 6) };
  const back = { x: useTransform(sx, (v) => v * -12), y: useTransform(sy, (v) => v * -9) };
  const on = fine && !reduce;
  const move = (e: PointerEvent<HTMLElement>) => {
    if (!on || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width) * 2 - 1);
    py.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const reset = () => { px.set(0); py.set(0); };
  return { media: on ? media : undefined, back: on ? back : undefined, move, reset };
}

/**
 * Scroll-linked exit as the hero scrolls away: the media zooms out and lags, the copy drifts up and fades.
 * MotionValues only. Reduced motion keeps the fade and drops the transforms.
 */
export function useHeroScroll(ref: RefObject<HTMLElement | null>) {
  const reduce = useReducedMotion();
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(p, [0, 1], [1, 0.84]);
  const mediaY = useTransform(p, [0, 1], [0, 120]);
  const copyY = useTransform(p, [0, 1], [0, -72]);
  const opacity = useTransform(p, [0, 0.65], [1, 0]);
  return reduce
    ? { media: undefined, copy: { opacity } }
    : { media: { scale, y: mediaY }, copy: { y: copyY, opacity } };
}
