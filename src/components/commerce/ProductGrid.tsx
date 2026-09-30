import { clsx } from "clsx";
import { Carousel } from "@/components/ui/Carousel";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import type { Product } from "@/types/domain";
import { ProductCard } from "./ProductCard";

/** 2-col mobile, 3-col tablet, 4-col desktop (cols={3} beside a filter sidebar). */
export function ProductGrid({ products, cols = 4, className }: { products: Product[]; cols?: 3 | 4; className?: string }) {
  const sizes = cols === 4 ? "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" : "(min-width: 1024px) 24vw, (min-width: 768px) 33vw, 50vw";
  return (
    <Stagger as="ul" className={clsx("grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3", cols === 4 && "lg:grid-cols-4", className)}>
      {products.map((p, i) => (
        <StaggerItem as="li" key={p.id}>
          <ProductCard product={p} preload={i < 2} sizes={sizes} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}

/** Swipeable product rail (scroll-snap Carousel) for merchandising rows and related products. */
export function ProductRail({ products, label }: { products: Product[]; label: string }) {
  return (
    <Carousel label={label} perView={{ base: 1.7, sm: 2.6, lg: 4 }} gap="var(--space-4)" bleed>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 38vw, 60vw" className="pb-2" />
      ))}
    </Carousel>
  );
}
