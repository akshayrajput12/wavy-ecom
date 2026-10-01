"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useRef } from "react";
import type { Category } from "@/types/domain";

const hover = "duration-(--dur-slow) ease-soft group-hover:opacity-100 group-focus-visible:opacity-100";

/** Tall category tile: full-bleed photo with scroll parallax, slow hover zoom, deepening gradient, rotating arrow. */
export function CategoryCard({ category: c, index }: { category: Category; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);

  return (
    <Link ref={ref} href={`/collections/${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-lg bg-surface-2 text-on-dark focus-visible:outline-offset-4">
      {/* taller than the card so the parallax shift never shows an edge */}
      <motion.div className="absolute inset-x-0 -inset-y-[7%]" style={reduce ? undefined : { y }}>
        {c.image?.url && (
          <Image src={c.image.url} alt="" fill sizes="(min-width: 1024px) 31vw, (min-width: 640px) 48vw, 82vw"
            className="object-cover transition-[scale] duration-(--dur-slow) ease-out group-hover:scale-[1.06] group-focus-visible:scale-[1.06]" />
        )}
      </motion.div>
      <span aria-hidden className="absolute inset-0 bg-linear-to-t from-black/75 via-black/15 to-transparent" />
      <span aria-hidden className={`absolute inset-0 bg-linear-to-t from-black/90 via-black/35 to-transparent opacity-0 transition-opacity ${hover}`} />

      <span aria-hidden className="t-index absolute left-4 top-4 text-on-dark/85 sm:left-5 sm:top-5">({String(index + 1).padStart(2, "0")})</span>
      <span aria-hidden className="absolute right-3 top-3 grid size-10 place-items-center rounded-pill border border-on-dark/40 bg-black/20 backdrop-blur-xs transition-[background-color,color,border-color,rotate] duration-(--dur-base) ease-soft group-hover:rotate-45 group-hover:border-on-dark group-hover:bg-on-dark group-hover:text-black group-focus-visible:rotate-45 group-focus-visible:bg-on-dark group-focus-visible:text-black sm:right-4 sm:top-4">
        <ArrowUpRight className="size-4" />
      </span>

      <span className="absolute inset-x-4 bottom-4 sm:inset-x-5 sm:bottom-5">
        <span className="t-h2 block text-on-dark">{c.name}</span>
        {c.description && (
          <span className="mt-1 line-clamp-2 translate-y-1.5 text-meta text-on-dark-soft transition-[translate,color] duration-(--dur-base) ease-soft group-hover:translate-y-0 group-hover:text-on-dark group-focus-visible:translate-y-0 sm:line-clamp-1">
            {c.description}
          </span>
        )}
      </span>
    </Link>
  );
}
