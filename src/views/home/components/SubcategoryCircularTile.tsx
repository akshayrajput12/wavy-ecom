"use client";

import Image from "next/image";
import Link from "next/link";
import type { SubcategoryTile as Tile } from "@/types/domain";

const PASTEL_BG = [
  "bg-[#EBF3FE]", // soft blue
  "bg-[#FDEDF0]", // soft pink
  "bg-[#FEF7E6]", // soft yellow
  "bg-[#F3EBF9]", // soft purple
  "bg-[#EAF5F1]", // soft mint
  "bg-[#FDF0E6]", // soft peach
  "bg-[#F0F7FF]", // soft ice blue
  "bg-[#FFF0F5]", // soft rose
];

export function SubcategoryCircularTile({ tile: t, index }: { tile: Tile; index: number }) {
  const bgClass = PASTEL_BG[index % PASTEL_BG.length];

  return (
    <Link
      href={`/collections/${t.slug}`}
      className="group flex flex-col items-center gap-2.5 p-2 transition-transform duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 rounded-2xl"
    >
      <div
        className={`relative size-24 sm:size-28 rounded-full ${bgClass} flex items-center justify-center p-3 shadow-xs transition-shadow duration-300 group-hover:shadow-md border border-line-soft`}
      >
        {t.image?.url ? (
          <Image
            src={t.image.url}
            alt={t.name}
            fill
            sizes="112px"
            className="object-contain p-3 transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <span className="font-display text-2xl font-bold text-ink-soft uppercase">
            {t.name.charAt(0)}
          </span>
        )}
      </div>

      <span className="text-body font-medium text-ink text-center line-clamp-1 max-w-[110px] tracking-tight group-hover:text-ink">
        {t.name}
      </span>
    </Link>
  );
}
