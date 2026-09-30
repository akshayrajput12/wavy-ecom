import type { Metadata } from "next";
import { getNewIn } from "@/backend/catalog/repo";
import type { SearchParams } from "@/components/commerce/filters/params";
import { newIn } from "@/data/content";
import { CollectionView } from "@/views/collection/CollectionView";
import { loadCollection } from "@/views/collection/loadCollection";

export const metadata: Metadata = { title: newIn.title, description: newIn.seoDescription, alternates: { canonical: "/new-in" } };

export default async function NewInRoute({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <CollectionView {...await loadCollection(await getNewIn(), await searchParams)} />;
}
