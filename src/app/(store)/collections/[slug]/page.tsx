import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCollection } from "@/backend/catalog/repo";
import type { SearchParams } from "@/components/commerce/filters/params";
import { CollectionView } from "@/views/collection/CollectionView";
import { loadCollection } from "@/views/collection/loadCollection";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getCollection((await params).slug);
  if (!page) return {};
  return {
    title: page.seo?.title ?? page.title,
    description: page.seo?.description ?? page.description,
    alternates: { canonical: `/collections/${page.slug}` },
    openGraph: page.image ? { images: [page.image.url] } : undefined,
  };
}

export default async function CollectionRoute({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const page = await getCollection(slug);
  if (!page) notFound();
  return <CollectionView {...await loadCollection(page, sp)} />;
}
