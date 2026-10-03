"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import { useState, type MouseEvent, type PointerEvent } from "react";
import { ArrowUpRightIcon } from "@/components/ui/icons";
import { useReducedMotion } from "@/components/ui/useMediaQuery";
import { homeCopy, homeStageCopy as copy } from "@/data/storefront";
import type { Collection } from "@/types/domain";

const SHUTTER = { duration: 0.55, ease: [0.76, 0, 0.24, 1] } as const;
const curtain = "transition-[clip-path] duration-(--dur-slow) ease-soft [clip-path:inset(100%_0_0_0)] group-hover:[clip-path:inset(0)] group-focus-visible:[clip-path:inset(0)] [@media(hover:none)]:[clip-path:none]";

/**
 * Lookbook panel: desaturated until active/hovered, image zooms and drifts against the pointer (CSS vars, no re-render),
 * title + count rise behind a clip-path curtain, press scales it down, and a click closes a paper "shutter" over it
 * before navigating. Modified clicks open natively; reduced motion navigates straight away with no drift.
 */
export function CollectionCard({ c, active, sizes, onFocus }: { c: Collection; active: boolean; sizes: string; onFocus: () => void }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [leaving, setLeaving] = useState(false);
  const href = `/collections/${c.slug}`;

  const drift = (e: PointerEvent<HTMLAnchorElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--px", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    e.currentTarget.style.setProperty("--py", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  };
  const settle = (e: PointerEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.removeProperty("--px");
    e.currentTarget.style.removeProperty("--py");
  };
  const open = (e: MouseEvent<HTMLAnchorElement>) => {
    if (reduce || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    setLeaving(true);
  };

  return (
    <Link href={href} draggable={false} onFocus={onFocus} onClick={open} onPointerMove={drift} onPointerLeave={settle}
      data-cursor={copy.view}
      className="group relative block size-full overflow-hidden bg-black-2 transition-transform duration-(--dur-base) ease-soft active:scale-[0.985] focus-visible:outline-offset-[-4px]">
      {c.image?.url && (
        <Image src={c.image.url} alt={c.image.alt} fill draggable={false} sizes={sizes}
          className={clsx(
            "object-cover transition-[filter,scale,translate] duration-(--dur-slow) ease-out",
            "translate-x-[calc(var(--px,0)*-2%)] translate-y-[calc(var(--py,0)*-2%)]",
            leaving ? "scale-[1.14]" : "scale-[1.04] group-hover:scale-[1.1]",
            active || leaving ? "grayscale-0" : "grayscale group-hover:grayscale-0",
          )} />
      )}
      <span aria-hidden className="absolute right-4 top-4 grid size-11 place-items-center rounded-pill border border-ink/40 text-ink backdrop-blur-sm transition-[background-color,color,border-color,rotate] duration-(--dur-base) ease-soft group-hover:rotate-45 group-hover:border-ink group-hover:bg-ink group-hover:text-canvas">
        <ArrowUpRightIcon className="size-4" />
      </span>
      <span className={clsx("absolute inset-x-0 bottom-0 block bg-linear-to-t from-black/80 to-transparent p-5 pt-20", curtain)}>
        <span className="block translate-y-4 transition-transform duration-(--dur-slow) ease-out group-hover:translate-y-0 group-focus-visible:translate-y-0 [@media(hover:none)]:translate-y-0">
          <span className="t-h3 block truncate">{c.name}</span>
          {c.productCount ? <span className="t-overline mt-1 block text-ink-soft">{homeCopy.products(c.productCount)}</span> : null}
        </span>
      </span>
      {leaving && (
        <motion.span aria-hidden className="absolute inset-0 bg-on-dark"
          initial={{ clipPath: "inset(100% 0% 0% 0%)" }} animate={{ clipPath: "inset(0% 0% 0% 0%)" }} transition={SHUTTER}
          onAnimationComplete={() => router.push(href)} />
      )}
    </Link>
  );
}
