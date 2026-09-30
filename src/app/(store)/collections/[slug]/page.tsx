import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { listProducts, resolveCollectionOrCategory } from "@/backend/catalog/repo";
import { productQueryFrom } from "@/backend/catalog/schema";
import { CollectionView } from "@/views/collection/CollectionView";

export async function generateMetadata({ params }: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const page = await resolveCollectionOrCategory((await params).slug);
  if (!page || page.kind === "redirect") return {};
  const x = page.kind === "category" ? page.category : page.collection;
  const image = x.seo?.ogImage ?? x.banner?.url ?? x.image?.url;
  return {
    title: x.seo?.title ?? x.name,
    description: x.seo?.description ?? x.description,
    alternates: { canonical: x.seo?.canonical ?? `/collections/${x.slug}` },
    robots: x.seo?.noindex ? { index: false } : undefined,
    openGraph: image ? { images: [image] } : undefined,
  };
}

export default async function CollectionRoute({ params, searchParams }: PageProps<"/collections/[slug]">) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const page = await resolveCollectionOrCategory(slug);
  if (!page) notFound();
  if (page.kind === "redirect") permanentRedirect(page.to);
  const isCategory = page.kind === "category";
  const list = await listProducts(productQueryFrom(sp, isCategory ? { category: slug } : { collection: slug }));
  const x = isCategory ? page.category : page.collection;
  return (
    <CollectionView
      title={x.name} description={x.description} banner={x.banner} isCategory={isCategory} list={list}
      trail={isCategory ? page.category.ancestors : []}
      subcategories={isCategory ? (page.category.children ?? []) : []}
      path={`/collections/${slug}`} params={sp}
    />
  );
}
