import type { Metadata } from "next";
import { getCategories, getCollections } from "@/backend/catalog/repo";
import { collectionsIndex } from "@/data/content";
import { CollectionsIndexView } from "@/views/collection/CollectionsIndexView";

export const metadata: Metadata = { title: collectionsIndex.title, description: collectionsIndex.description };

export default async function CollectionsPage() {
  const [cats, cols] = await Promise.all([getCategories(), getCollections()]);
  return <CollectionsIndexView items={[...cats.filter((c) => !c.parentId), ...cols]} />;
}
