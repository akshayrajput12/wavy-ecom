"use client";

/*
 * Animated icon base.
 * Motion ideas adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License,
 * Copyright (c) 2024-2026 pqoqubbw. SVG paths are Lucide (https://lucide.dev), ISC License, Copyright (c) Lucide Contributors.
 * Rewritten for `framer-motion` (same API as `motion/react`, already installed) and driven by the PARENT control:
 * each icon finds its closest a/button/summary/label (or `[data-icon-host]`, else its parent element) and plays on
 * pointer hover or keyboard focus, then settles back. `trigger` replays it on a state change. Never loops;
 * with reduced motion nothing plays.
 */
import { MotionConfig, motion, useAnimationControls, useReducedMotion, type Transition, type Variants } from "framer-motion";
import { useEffect, useRef, type ComponentType, type ReactNode, type RefObject } from "react";

export const EASE_OUT = [0.22, 1, 0.36, 1] as const; // mirrors --ease-out
export const ICON_T: Transition = { duration: 0.35, ease: EASE_OUT };

const HOST = "a,button,summary,label,[role=button],[data-icon-host]";

export interface IconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
  /** Replays the animation whenever this value changes (cart count…); a change FROM `undefined` (not ready yet) is skipped. */
  trigger?: unknown;
  /** Plays once on mount (an icon that appears as the result of an action, e.g. "copied"). */
  appear?: boolean;
}

function useHostControls(ref: RefObject<Element | null>, trigger: unknown, appear?: boolean) {
  const controls = useAnimationControls();
  const reduce = useReducedMotion();
  const prev = useRef(trigger);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    const host = el?.closest(HOST) ?? el?.parentElement;
    if (!host || reduce) return;

    const play = () => {
      if (mountedRef.current) void controls.start("animate");
    };
    const rest = () => {
      if (mountedRef.current) void controls.start("normal");
    };

    if (appear) {
      requestAnimationFrame(() => {
        if (mountedRef.current) void controls.start("animate").then(rest);
      });
    }

    host.addEventListener("pointerenter", play);
    host.addEventListener("pointerleave", rest);
    host.addEventListener("focusin", play);
    host.addEventListener("focusout", rest);
    return () => {
      host.removeEventListener("pointerenter", play);
      host.removeEventListener("pointerleave", rest);
      host.removeEventListener("focusin", play);
      host.removeEventListener("focusout", rest);
    };
  }, [controls, ref, reduce, appear]);

  useEffect(() => {
    const was = prev.current;
    prev.current = trigger;
    if (Object.is(was, trigger) || was === undefined || reduce || !mountedRef.current) return;
    void controls.start("animate").then(() => {
      if (mountedRef.current) void controls.start("normal");
    });
  }, [trigger, controls, reduce]);

  return controls;
}

/** Lucide-compatible 24px stroke SVG whose `variants` (and its children's) play on parent hover/focus. */
export function IconSvg({
  className,
  size = 24,
  strokeWidth = 2,
  trigger,
  appear,
  variants,
  transition = ICON_T,
  children,
}: IconProps & {
  variants?: Variants;
  transition?: Transition;
  children: ReactNode;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const controls = useHostControls(ref, trigger, appear);
  return (
    <motion.svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      overflow="visible"
      aria-hidden="true"
      focusable="false"
      initial="normal"
      animate={controls}
      variants={variants}
      transition={transition}
    >
      <MotionConfig transition={transition}>{children}</MotionConfig>
    </motion.svg>
  );
}

const lift: Variants = { normal: { y: 0, rotate: 0, scale: 1 }, animate: { y: -1.5, rotate: -6, scale: 1.06 } };

/** Gentle lift + tilt for any plain lucide icon without a bespoke animation (admin nav). Client callers only: `icon` is a component. */
export function IconMotion({
  icon: Icon,
  className,
  strokeWidth,
  trigger,
}: IconProps & {
  icon: ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const controls = useHostControls(ref, trigger);
  return (
    <motion.span ref={ref} className="inline-flex shrink-0" initial="normal" animate={controls} variants={lift} transition={ICON_T}>
      <Icon className={className} strokeWidth={strokeWidth} aria-hidden />
    </motion.span>
  );
}
