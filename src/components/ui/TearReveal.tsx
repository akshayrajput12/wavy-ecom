"use client";

import { clsx } from "clsx";
import { useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { tearRevealCopy } from "@/data/storefront";
import type { Cta } from "@/types/domain";
import { ButtonLink } from "./Button";
import { ArtDefs, Eye, Fur, Half } from "./TearArt";
import { CX, CY, EYES, FAR, FRAME, VIEW_W, buildFibres, clamp01, easeOutBack, pathD, rng, scrollProgress, stages, tearLine, type Pt } from "./tearGeometry";

export interface TearRevealProps {
  /** The big word that gets torn. */
  word: string;
  /** Small line above the word. Empty hides it. */
  tagline?: string;
  /** "tiger" (default): a drawn tiger rises into the gap. "image": the paper clears off a full-bleed photo (needs `image`). */
  variant?: "tiger" | "image";
  image?: string;
  imageAlt?: string;
  /** Pill that fades in (and becomes focusable) once fully open. */
  cta?: Cta;
  /** Height of the pinned stage. A definite length, never a percentage. */
  height?: string;
  /** Extra scroll the tear plays over, on top of `height` (md and up). */
  scrollDistance?: string;
  /** Same, below md. */
  mobileScrollDistance?: string;
  /** 0..1. Drive the tear yourself instead of from scroll (1 = fully torn). */
  progress?: number;
  hint?: boolean;
  className?: string;
}

type Frame = { p: number; look: Pt; blink: number; squint: number };
const OPEN: Frame = { p: 1, look: [0, 0], blink: 0, squint: 0 };
const FIBRES = buildFibres();
const LINE = tearLine();
const noop = () => () => {};

/**
 * A poster that tears in two as you scroll past (sticky stage over a scroll runway). Lenis scrolls the native document,
 * so sticky + getBoundingClientRect stay exact; one rAF loop reads one rect per frame, only while on screen, and sets
 * state only when something changed. Reduced motion: the fully torn final state, static, no runway.
 */
export function TearReveal({
  word, tagline, variant = "tiger", image, imageAlt = "", cta,
  height = "100svh", scrollDistance = "160svh", mobileScrollDistance = "110svh", progress, hint = true, className,
}: TearRevealProps) {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // false while hydrating (matches the server), then Framer's live preference
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const reduced = useReducedMotion() === true && hydrated;
  const id = "tr" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const [live, setLive] = useState<Frame>({ p: progress ?? 0, look: [0, 0], blink: 0, squint: 0 });
  const progressRef = useRef(progress);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const squintAt = useRef(-1e9);
  const photo = variant === "image" && image ? image : undefined;
  const controlled = progress !== undefined;

  useEffect(() => { progressRef.current = progress; }, [progress]);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (reduced || !root || !stage) return;
    let raf = 0;
    let visible = true;
    let p = progressRef.current ?? 0;
    let look: Pt = [0, 0];
    let idle: Pt = [0, 0];
    let nextIdle = 0;
    let nextBlink = performance.now() + 2500;
    let last: Frame | null = null;

    const tick = (now: number) => {
      raf = 0;
      if (!visible) return;
      let target: number;
      if (progressRef.current !== undefined) target = clamp01(progressRef.current);
      else {
        const r = root.getBoundingClientRect();
        target = scrollProgress(r.top, r.height, stage.offsetHeight);
      }
      p += (target - p) * 0.14;
      if (Math.abs(target - p) < 0.0005) p = target;

      // where the eyes look: the pointer if there is one, else a wandering gaze
      let want: Pt = idle;
      if (pointer.current) {
        const r = stage.getBoundingClientRect();
        want = [
          Math.max(-1, Math.min(1, (pointer.current.x - r.left - r.width / 2) / (r.width * 0.35))),
          Math.max(-1, Math.min(1, (pointer.current.y - r.top - r.height * 0.58) / (r.height * 0.35))),
        ];
      } else if (now > nextIdle) {
        const g = rng(Math.floor(now));
        idle = [(g() - 0.5) * 1.4, (g() - 0.5) * 0.8];
        nextIdle = now + 1400 + g() * 1800;
      }
      look = [look[0] + (want[0] - look[0]) * 0.14, look[1] + (want[1] - look[1]) * 0.14];

      // blinks: a quick close and open every few seconds
      const since = now - nextBlink;
      const blink = since <= 0 ? 0 : since < 90 ? since / 90 : since < 200 ? 1 - (since - 90) / 110 : 0;
      if (since > 200) nextBlink = now + 2600 + Math.random() * 3200;
      const squint = Math.max(0, 1 - (now - squintAt.current) / 900);

      if (!last || Math.abs(p - last.p) > 1e-4 || Math.abs(look[0] - last.look[0]) > 1e-3 || Math.abs(look[1] - last.look[1]) > 1e-3
        || blink !== last.blink || squint !== last.squint) {
        last = { p, look, blink, squint };
        setLive(last);
      }
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
    });
    io.observe(root);
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [reduced]);

  const f = reduced ? { ...OPEN, p: clamp01(progress ?? 1) } : live;
  const s = stages(f.p);
  const pop = easeOutBack(s.pop);
  const blink = Math.max(1 - clamp01(pop), f.blink, f.squint * 0.45); // eyes shut until the tiger is up
  const shake = Math.sin(f.p * 900) * 6 * s.shake;
  const crack = LINE.filter(([x]) => Math.abs(x - CX) <= s.crack * 620);
  const tiger = `translate(${CX} ${(CY + (1 - s.rise) * 150).toFixed(2)}) rotate(-7) scale(${(1.34 - 0.06 * s.rise).toFixed(4)})`;
  const done = photo ? s.clear > 0.95 : s.pop > 0.95;
  const pinned = !(controlled || reduced);

  const sheet = (
    <>
      <rect x={-FAR} y={-FAR} width={FAR * 2 + VIEW_W} height={FAR * 2} style={{ fill: "var(--canvas)" }} />
      {tagline && (
        <text x={CX} y={150} textAnchor="middle"
          style={{ fill: "var(--ink-soft)", fontFamily: "var(--font-ui)", fontSize: 30, fontWeight: 600, letterSpacing: "0.42em" }}>
          {tagline}
        </text>
      )}
      {/* stretched to a fixed width so any face fits; short words (404) are not ballooned */}
      <text x={CX} y={404} textAnchor="middle" textLength={Math.min(880, word.length * 150)} lengthAdjust="spacingAndGlyphs"
        style={{ fill: "var(--ink)", fontFamily: "var(--font-editorial)", fontSize: 250, fontWeight: 600, letterSpacing: 0 }}>
        {word}
      </text>
    </>
  );

  return (
    <section
      ref={rootRef}
      className={clsx("relative w-full overflow-clip bg-canvas", pinned ? "h-[calc(var(--tr-h)+var(--tr-run-sm))] md:h-[calc(var(--tr-h)+var(--tr-run))]" : "h-(--tr-h)", className)}
      style={{ "--tr-h": height, "--tr-run": scrollDistance, "--tr-run-sm": mobileScrollDistance } as CSSProperties}
    >
      <div
        ref={stageRef}
        className={clsx("sticky top-0 h-(--tr-h) w-full overflow-hidden", !photo && s.pop > 0.9 && "cursor-crosshair")}
        onPointerMove={(e) => { pointer.current = { x: e.clientX, y: e.clientY }; }}
        onPointerLeave={() => { pointer.current = null; }}
        onPointerDown={() => { if (s.pop > 0.5) squintAt.current = performance.now(); }}
      >
        {photo && (
          <div className="absolute inset-0 overflow-hidden">
            <Image src={photo} alt={imageAlt} fill sizes="100vw" className="object-cover"
              style={{ transform: `scale(${(1.12 - 0.12 * (0.35 * s.open + 0.65 * s.clear)).toFixed(4)})` }} />
          </div>
        )}
        <svg viewBox={FRAME} preserveAspectRatio="xMidYMid meet" role="img"
          aria-label={(photo ? tearRevealCopy.image : tearRevealCopy.tiger)(word, tagline)}
          className="pointer-events-none absolute inset-0 block size-full max-w-none">
          <ArtDefs id={id} />
          <g transform={`translate(${shake.toFixed(2)} ${(shake * 0.4).toFixed(2)})`}>
            {!photo && s.open > 0 && (
              <g transform={tiger}>
                <Fur id={id} />
                <g filter={s.pop > 0.02 ? `url(#${id}-glow)` : undefined}>
                  {EYES.map(([x, y], i) => (
                    <Eye key={i} id={id} x={x} y={y} flip={i === 0} look={f.look} blink={blink} pupil={1.3 - 0.5 * s.pop + 0.35 * f.squint} scale={0.9 + 0.1 * pop} fibres={FIBRES} />
                  ))}
                </g>
              </g>
            )}
            {/* whole until it tears (two clipped halves would leave a hairline seam), then two halves parting along the tear */}
            {s.open > 0 ? (
              <>
                <Half id={id} side="top" line={LINE} open={s.open} clear={photo ? s.clear : 0}>{sheet}</Half>
                <Half id={id} side="bottom" line={LINE} open={s.open} clear={photo ? s.clear : 0}>{sheet}</Half>
              </>
            ) : sheet}
            {s.crack > 0 && s.open < 0.15 && crack.length > 1 && (
              <path d={pathD(crack, false)} fill="none" style={{ stroke: "var(--ink)" }} strokeWidth={2.4} strokeLinejoin="bevel" opacity={1 - s.open / 0.15} />
            )}
          </g>
        </svg>

        {hint && pinned && (
          <div aria-hidden className="t-index pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center gap-2 uppercase tracking-[0.35em] text-ink-soft"
            style={{ opacity: Math.max(0, 0.7 - s.crack * 3) }}>
            {tearRevealCopy.hint}
            <span className="block h-6 w-px animate-pulse bg-ink-soft" />
          </div>
        )}
        {cta && (
          <div inert={!done} className="absolute inset-x-0 bottom-10 flex justify-center px-4 transition-opacity duration-(--dur-slow) ease-out sm:bottom-14"
            style={{ opacity: done ? 1 : 0 }}>
            <ButtonLink href={cta.href} size="lg" className="shadow-md">{cta.label}</ButtonLink>
          </div>
        )}
      </div>
    </section>
  );
}
