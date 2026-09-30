import { siteConfig } from "@/lib/site";
import type { Product, Review } from "@/types/domain";

/** schema.org Product markup. `<` is escaped so the JSON can't break out of the script tag. */
export function productJsonLd(p: Product, reviews: Review[]): string {
  const prices = p.variants.map((v) => v.price / 100);
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.shortDescription || p.description.slice(0, 500),
    image: p.images.map((i) => i.url),
    sku: p.variants[0]?.sku,
    ...(p.brand ? { brand: { "@type": "Brand", name: p.brand } } : {}),
    ...(p.category ? { category: p.category.name } : {}),
    aggregateRating: p.reviewCount ? { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviewCount } : undefined,
    review: reviews.slice(0, 5).map((r) => ({
      "@type": "Review", author: { "@type": "Person", name: r.author }, datePublished: r.createdAt, name: r.title, reviewBody: r.body,
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
    })),
    offers: prices.length ? {
      "@type": "AggregateOffer",
      priceCurrency: siteConfig.currency,
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: p.variants.length,
      availability: p.variants.some((v) => v.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${siteConfig.url}/products/${p.slug}`,
    } : undefined,
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
