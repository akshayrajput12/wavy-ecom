"use client";

import { motion, useMotionValue, useSpring, useTransform, useVelocity } from "framer-motion";
import { useEffect, useState, type RefObject } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { useMediaQuery, useReducedMotion } from "./useMediaQuery";

type Mode = "off" | "idle" | "view" | "drag";
const FOLLOW = { stiffness: 520, damping: 42, mass: 0.5 };
const SIZE: Record<Mode, number> = { off: 0.3, idle: 0.72, view: 1, drag: 0.6 };
const SPREAD: Record<Mode, number> = { off: 0, idle: 0, view: 0, drag: 5 };

/**
 * Custom "‹ Drag ›" cursor for a horizontal rail (opt in: `<DragCursor target={railRef} label="Drag" />` beside the rail).
 * Fine pointers only and never with reduced motion: everyone else keeps the native cursor. It follows the mouse on
 * springs (MotionValues, no re-render per move), grows and reads the `data-cursor` label of the hovered element
 * ("View"), shrinks at mousedown and squashes/stretches with drag speed. The native cursor is hidden only inside
 * `target` (`[data-drag-cursor]` in globals.css). Positioned `fixed`, so it inherits the rail's colour tokens (.on-dark);
 * it needs no transformed ancestor.
 */
export function DragCursor({ target, label }: { target: RefObject<HTMLElement | null>; label: string }) {
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduce = useReducedMotion();
  const on = fine && !reduce;
  const [mode, setMode] = useState<Mode>("off");
  const [hover, setHover] = useState("");
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const press = useMotionValue(0);
  const x = useSpring(mx, FOLLOW);
  const y = useSpring(my, FOLLOW);
  const vx = useVelocity(x);
  const stretch = useTransform(() => press.get() * Math.min(Math.abs(vx.get()) / 2400, 0.32));
  const scaleX = useTransform(stretch, (s) => 1 + s);
  const scaleY = useTransform(stretch, (s) => 1 - s * 0.55);

  useEffect(() => {
    const el = target.current;
    if (!el || !on) return;
    let down = false;
    const sync = (under: Element | null) => {
      const host = under && el.contains(under) ? under.closest<HTMLElement>("[data-cursor]") : null;
      setHover(host?.dataset.cursor ?? "");
      setMode(!under || !el.contains(under) ? "off" : down ? "drag" : host ? "view" : "idle");
    };
    const mouse = (e: PointerEvent) => e.pointerType === "mouse";
    const enter = (e: PointerEvent) => {
      if (!mouse(e)) return;
      mx.set(e.clientX); my.set(e.clientY);
      x.jump(e.clientX); y.jump(e.clientY); // appear at the pointer, don't fly in from the last spot
      sync(e.target as Element);
    };
    const move = (e: PointerEvent) => { if (mouse(e)) { mx.set(e.clientX); my.set(e.clientY); } };
    const over = (e: PointerEvent) => { if (mouse(e) && !down) sync(e.target as Element); };
    const leave = (e: PointerEvent) => { if (mouse(e) && !down) setMode("off"); };
    const pressDown = (e: PointerEvent) => {
      if (!mouse(e) || e.button !== 0) return;
      down = true; press.set(1); setMode("drag");
    };
    const release = (e: PointerEvent) => {
      if (!down) return;
      down = false; press.set(0);
      sync(document.elementFromPoint(e.clientX, e.clientY)); // drags often end outside the rail
    };
    el.setAttribute("data-drag-cursor", "");
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerover", over);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("pointerdown", pressDown);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      el.removeAttribute("data-drag-cursor");
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerover", over);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointerdown", pressDown);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, [target, on, mx, my, x, y, press]);

  if (!on) return null;
  return (
    <motion.div aria-hidden className="pointer-events-none fixed left-0 top-0 z-40" style={{ x, y }}
      initial={false} animate={{ opacity: mode === "off" ? 0 : 1 }} transition={{ duration: 0.2 }}>
      <div className="t-overline absolute grid size-24 -translate-1/2 place-items-center text-canvas">
        <motion.span className="absolute inset-0 rounded-pill bg-ink" style={{ scaleX, scaleY }}
          initial={false} animate={{ scale: SIZE[mode] }} transition={{ type: "spring", stiffness: 380, damping: 24 }} />
        <span className="relative flex items-center gap-1">
          <motion.span initial={false} animate={{ x: -SPREAD[mode] }}><ChevronLeftIcon className="size-3" strokeWidth={2.5} /></motion.span>
          {mode === "view" && hover ? hover : label}
          <motion.span initial={false} animate={{ x: SPREAD[mode] }}><ChevronRightIcon className="size-3" strokeWidth={2.5} /></motion.span>
        </span>
      </div>
    </motion.div>
  );
}
