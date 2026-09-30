import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getCategoryBySlug, getProductBySlug, getRedirect, getRelatedProducts } from "@/backend/catalog/repo";
import { listProductReviews } from "@/backend/reviews/repo";
import { ProductView } from "@/views/product/ProductView";
import { productJsonLd } from "@/views/product/jsonLd";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return {};
  const title = p.seo?.title ?? p.name;
  const description = p.seo?.description ?? (p.shortDescription || p.description.slice(0, 155));
  const image = p.seo?.ogImage ?? p.images[0]?.url;
  return {
    title, description,
    alternates: { canonical: p.seo?.canonical ?? `/products/${p.slug}` },
    robots: p.seo?.noindex ? { index: false } : undefined,
    openGraph: { title, description, images: image ? [{ url: image, alt: p.images[0]?.alt ?? p.name }] : undefined },
  };
}

export default async function ProductRoute({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    const to = await getRedirect(`/products/${slug}`);
    if (to) permanentRedirect(to);
    notFound();
  }
  const [reviews, related, category] = await Promise.all([
    listProductReviews(product.id, { pageSize: 6 }),
    getRelatedProducts(product, 8),
    product.category ? getCategoryBySlug(product.category.slug) : null,
  ]);
  const trail = category ? [...category.ancestors, { id: category.id, name: category.name, slug: category.slug }] : [];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: productJsonLd(product, reviews.items) }} />
      <ProductView product={product} trail={trail} reviews={reviews} related={related} />
    </>
  );
}
