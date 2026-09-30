import type { Metadata } from "next";
import { listCategories, listCollections } from "@/backend/catalog/repo";
import { collectionsIndexCopy } from "@/data/copy";
import { CollectionsIndexView } from "@/views/collection/CollectionsIndexView";

export const metadata: Metadata = { title: collectionsIndexCopy.title, alternates: { canonical: "/collections" } };

export default async function CollectionsPage() {
  const [categories, collections] = await Promise.all([listCategories(), listCollections()]);
  return <CollectionsIndexView categories={categories} collections={collections} />;
}
