import type { Metadata } from "next";
import { getCategories, getFacets, getProducts, searchProducts } from "@/backend/catalog/repo";
import { flatParams, parseFilters, type SearchParams } from "@/components/commerce/filters/params";
import { searchCopy } from "@/data/content";
import { SearchView } from "@/views/search/SearchView";

type Props = { searchParams: Promise<SearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = String((await searchParams).q ?? "").trim();
  return { title: q ? `“${q}”` : searchCopy.title, robots: { index: false } };
}

export default async function SearchRoute({ searchParams }: Props) {
  const sp = await searchParams;
  const q = String(Array.isArray(sp.q) ? sp.q[0] : (sp.q ?? "")).trim().slice(0, 100);
  const selected = parseFilters(sp);
  const [base, results, top, cats] = await Promise.all([searchProducts(q), searchProducts(q, selected), getProducts({ sort: "rating" }), getCategories()]);
  const found = new Set(results.map((p) => p.id));
  return (
    <SearchView
      q={q}
      results={results}
      total={base.length}
      facets={getFacets(base)}
      selected={selected}
      params={flatParams(sp)}
      recommendations={top.filter((p) => !found.has(p.id)).slice(0, 8)}
      departments={cats.filter((c) => !c.parentId)}
    />
  );
}
