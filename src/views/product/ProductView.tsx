import Link from "next/link";
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
  return (
    <div className="pb-28 lg:pb-24">
      <div className="container-x">
        <nav aria-label="Breadcrumb" className="t-meta py-4">
          <ol className="flex flex-wrap gap-1.5">
            <li><Link href="/" className="hover:text-ink">{c.breadcrumbHome}</Link> <span aria-hidden>/</span></li>
            {trail.map((t) => <li key={t.id}><Link href={`/collections/${t.slug}`} className="hover:text-ink">{t.name}</Link> <span aria-hidden>/</span></li>)}
            <li aria-current="page" className="text-ink">{p.name}</li>
          </ol>
        </nav>
        <ProductHero product={p} />
      </div>

      <div className="container-x mt-20 border-t border-line pt-14"><ProductDetails product={p} /></div>
      <div className="container-x mt-20 border-t border-line pt-14"><Reviews productId={p.id} productName={p.name} initial={reviews} /></div>

      {related.length > 0 && (
        <section className="container-x mt-20">
          <Reveal><h2 className="t-display mb-8">{c.related}</h2></Reveal>
          <ProductRail products={related} label={c.related} />
        </section>
      )}
    </div>
  );
}
