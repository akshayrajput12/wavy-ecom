import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getProductBySlug, getProducts, getRecommendations, getReviews } from "@/backend/catalog/repo";
import { site } from "@/data/site";
import { ProductView } from "@/views/product/ProductView";
import { productJsonLd } from "@/views/product/jsonLd";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return {};
  const title = p.seo?.title ?? `${p.name} — ${p.descriptor}`;
  const description = p.seo?.description ?? p.description.slice(0, 155);
  return {
    title, description,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: { title: `${title} · ${site.name}`, description, images: [{ url: p.seo?.ogImage ?? p.images[0].url, alt: p.images[0].alt }] },
  };
}

export default async function ProductRoute({ params }: Props) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();
  const [reviews, recommendations, cats] = await Promise.all([getReviews(product.id), getRecommendations(product, 8), getCategories()]);
  const category = cats.find((c) => c.id === product.categoryId);
  const department = cats.find((c) => c.id === category?.parentId);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: productJsonLd(product, reviews) }} />
      <ProductView product={product} category={category} department={department} reviews={reviews} recommendations={recommendations} />
    </>
  );
}
