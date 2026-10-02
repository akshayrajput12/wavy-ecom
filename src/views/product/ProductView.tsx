import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ChevronRightIcon } from "@/components/ui/icons";
import { ProductRail } from "@/components/commerce";
import { Reveal } from "@/components/ui/Reveal";
import { productCopy as c } from "@/data/copy";
import type { ReviewPage } from "@/backend/reviews/repo";
import type { CategoryRef, Product } from "@/types/domain";
import { ProductDetails } from "./components/ProductDetails";
import { ProductHero } from "./components/ProductHero";
import { Reviews } from "./components/Reviews";

export interface ProductViewProps { product: Product; trail: CategoryRef[]; reviews: ReviewPage; related: Product[] }

export function ProductView({ product: p, trail, reviews, related }: ProductViewProps) {
  const parent = trail.at(-1);
  return (
    <div className="pb-28 lg:pb-24">
      <div className="container-x">
        <nav aria-label="Breadcrumb" className="t-meta py-5">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li className="flex items-center gap-1.5"><Link href="/" className="hover:text-ink">{c.breadcrumbHome}</Link><ChevronRight className="size-3" aria-hidden /></li>
            {trail.map((t) => (
              <li key={t.id} className="flex items-center gap-1.5"><Link href={`/collections/${t.slug}`} className="hover:text-ink">{t.name}</Link><ChevronRight className="size-3" aria-hidden /></li>
            ))}
            <li aria-current="page" className="truncate text-ink">{p.name}</li>
          </ol>
        </nav>
        <ProductHero product={p} details={<ProductDetails product={p} />} />
      </div>

      <div className="container-x section-y mt-12 border-t border-line"><Reviews productId={p.id} productName={p.name} initial={reviews} /></div>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="container-x">
          <Reveal className="mb-8 flex items-end justify-between gap-6 lg:mb-10">
            <div>
              <p className="t-overline">{c.relatedOverline}</p>
              <h2 id="related-title" className="t-display mt-3">{c.related}</h2>
            </div>
            {parent && (
              <Link href={`/collections/${parent.slug}`} className="group inline-flex min-h-11 shrink-0 items-center gap-1 text-meta font-medium underline decoration-line underline-offset-4 hover:decoration-ink">
                {c.viewAll}<ChevronRightIcon className="size-3.5" />
              </Link>
            )}
          </Reveal>
          <ProductRail products={related} label={c.related} />
        </section>
      )}
    </div>
  );
}
