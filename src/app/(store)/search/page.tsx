import type { Metadata } from "next";
import { listCategories, listProducts } from "@/backend/catalog/repo";
import { productQueryFrom } from "@/backend/catalog/schema";
import { searchCopy } from "@/data/copy";
import { SearchView } from "@/views/search/SearchView";

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const q = productQueryFrom(await searchParams).q;
  return { title: q ? `“${q}”` : searchCopy.title, robots: { index: false } };
}

export default async function SearchRoute({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const query = productQueryFrom(sp);
  const [list, categories] = await Promise.all([query.q ? listProducts(query) : null, listCategories()]);
  return <SearchView q={query.q ?? ""} list={list} categories={categories} params={sp} />;
}
