import Link from "next/link";
import { Accordion } from "@/components/ui/Controls";
import { Reveal } from "@/components/ui/Reveal";
import { ProductRail } from "@/components/commerce";
import { productCopy as c } from "@/data/content";
import type { Category, Product, Review } from "@/types/domain";
import { Gallery } from "./components/Gallery";
import { PurchasePanel } from "./components/PurchasePanel";
import { Reviews } from "./components/Reviews";

export interface ProductViewProps {
  product: Product;
  category?: Category;
  department?: Category;
  reviews: Review[];
  recommendations: Product[];
}

export function ProductView({ product: p, category, department, reviews, recommendations }: ProductViewProps) {
  return (
    <div className="pb-24">
      <div className="container-x">
        <nav aria-label="Breadcrumb" className="t-meta py-4">
          <ol className="flex flex-wrap gap-1.5">
            <li><Link href="/" className="hover:text-ink">{c.breadcrumbHome}</Link> /</li>
            {department && <li><Link href={`/collections/${department.slug}`} className="hover:text-ink">{department.name}</Link> /</li>}
            {category && department && <li><Link href={`/collections/${department.slug}?category=${category.slug}`} className="hover:text-ink">{category.name}</Link> /</li>}
            <li aria-current="page" className="text-ink">{p.name}</li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7"><Gallery images={p.images} name={p.name} /></div>
          <div className="lg:col-span-5">
            <div>
              <PurchasePanel product={p} />
              <div className="mt-8">
                <p className="text-body-lg leading-relaxed text-ink-soft">{p.description}</p>
                <div className="mt-6 border-t border-line">
                  <Accordion title={c.details} name="pdp" defaultOpen>
                    <dl className="grid grid-cols-[7rem_1fr] gap-y-2">
                      {p.material && (<><dt className="font-medium text-ink">{c.material}</dt><dd>{p.material}</dd></>)}
                      <dt className="font-medium text-ink">{c.construction}</dt><dd>{p.descriptor}</dd>
                    </dl>
                  </Accordion>
                  {p.fit && <Accordion title={c.fit} name="pdp">{p.fit}</Accordion>}
                  {p.care && <Accordion title={c.care} name="pdp">{p.care}</Accordion>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-x mt-24 border-t border-line pt-14">
        <Reviews reviews={reviews} rating={p.rating} count={p.reviewCount} />
      </div>

      {recommendations.length > 0 && (
        <section className="container-x mt-24 overflow-hidden">
          <Reveal><h2 className="t-display mb-10">{c.recommendations}</h2></Reveal>
          <ProductRail products={recommendations} />
        </section>
      )}
    </div>
  );
}
