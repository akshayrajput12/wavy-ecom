"use client";

import Image from "next/image";
import { clsx } from "clsx";
import { motion, type Variants } from "framer-motion";
import { useReducedMotion } from "@/components/ui/useMediaQuery";
import type { Media } from "@/types/domain";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const tile: Variants = { hidden: { opacity: 0, y: 28, scale: 0.94 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: EASE_OUT } } };

/** Decorative arc of small rounded photos (centre high, ends low) that float in staggered. */
export function Mosaic({ images }: { images: Media[] }) {
  const reduce = useReducedMotion();
  const n = images.length;
  return (
    <motion.ul
      aria-hidden
      className="mb-10 flex items-start justify-center gap-2 [--arc:2.5rem] sm:gap-3 md:mb-14 md:[--arc:6rem]"
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
    >
      {images.map((m, i) => {
        const t = n > 1 ? (i / (n - 1)) * 2 - 1 : 0; // -1 … 1 across the row
        return (
          <motion.li
            key={m.url}
            variants={tile}
            style={{ marginTop: `calc(${(t * t).toFixed(3)} * var(--arc))` }}
            className={clsx(
              "relative aspect-[3/4] min-w-0 max-w-28 flex-1 overflow-hidden rounded-md bg-surface-2 shadow-sm",
              n > 8 && (i < 2 || i >= n - 2) && "max-md:hidden", // fewer, larger tiles on phones
            )}
          >
            <Image src={m.url} alt="" fill sizes="(min-width: 768px) 112px, 18vw" className="object-cover" />
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
