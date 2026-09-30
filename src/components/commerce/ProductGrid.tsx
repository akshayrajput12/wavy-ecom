"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import type { Product } from "@/types/domain";
import { ProductCard } from "./ProductCard";

/** 2-col mobile → 3-col tablet → 4-col desktop (pass cols={3} beside a filter sidebar). */
export function ProductGrid({ products, cols = 4, className }: { products: Product[]; cols?: 3 | 4; className?: string }) {
  return (
    <ul className={clsx("grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3", cols === 4 && "lg:grid-cols-4", className)}>
      {products.map((p, i) => (
        <Reveal as="li" key={p.id} delay={(i % cols) * 0.06}>
          <ProductCard product={p} priority={i < 2} sizes={cols === 4 ? "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" : "(min-width: 768px) 28vw, 50vw"} />
        </Reveal>
      ))}
    </ul>
  );
}

/** Horizontal, scroll-snapping rail for merchandising rows. */
export function ProductRail({ products }: { products: Product[] }) {
  const railRef = useRef<HTMLUListElement>(null);
  const reduce = useReducedMotion();
  const [edges, setEdges] = useState({ start: true, end: false });

  const updateEdges = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setEdges({ start: rail.scrollLeft <= 2, end: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2 });
  }, []);

  useEffect(() => {
    updateEdges();
    const rail = railRef.current;
    if (!rail || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [products.length, updateEdges]);

  const move = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector("li");
    const gap = Number.parseFloat(getComputedStyle(rail).columnGap) || 16;
    rail.scrollBy({ left: direction * (card?.getBoundingClientRect().width ?? rail.clientWidth * 0.8) + direction * gap, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="relative">
    <div className="mb-3 hidden justify-end gap-2 sm:flex">
      <button type="button" onClick={() => move(-1)} disabled={edges.start} aria-label="Scroll products left" className="grid size-10 place-items-center rounded-full border border-line text-ink transition-colors hover:bg-surface-warm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-default disabled:opacity-35">
        <ChevronLeft className="size-4" aria-hidden />
      </button>
      <button type="button" onClick={() => move(1)} disabled={edges.end} aria-label="Scroll products right" className="grid size-10 place-items-center rounded-full border border-line text-ink transition-colors hover:bg-surface-warm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-default disabled:opacity-35">
        <ChevronRight className="size-4" aria-hidden />
      </button>
    </div>
    <ul ref={railRef} onScroll={updateEdges} tabIndex={0} aria-label="Featured products, scroll horizontally" className="-mx-[var(--gutter)] flex snap-x snap-proximity gap-4 overflow-x-auto overscroll-x-contain scroll-px-(--gutter) px-(--gutter) pb-3 [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:gap-5 [&::-webkit-scrollbar]:hidden">
      {products.map((p) => (
        <li key={p.id} aria-label={p.name} className="w-[68vw] shrink-0 snap-start sm:w-[40vw] lg:w-[calc((100%-3*1.25rem)/4)]">
          <ProductCard product={p} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 40vw, 68vw" />
        </li>
      ))}
    </ul>
    </div>
  );
}
