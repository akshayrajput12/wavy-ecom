import "server-only";
import { getFacets, getProducts, type CollectionPage } from "@/backend/catalog/repo";
import { flatParams, parseFilters, type SearchParams } from "@/components/commerce/filters/params";
import type { CollectionViewProps } from "./CollectionView";

/** Base scope → facets; scope + URL refinements → grid. Shared by /collections/[slug] and /new-in. */
export async function loadCollection(page: CollectionPage, sp: SearchParams): Promise<CollectionViewProps> {
  const selected = parseFilters(sp);
  const [all, products] = await Promise.all([
    getProducts(page.scope),
    getProducts({ ...page.scope, ...selected, sort: selected.sort ?? page.scope.sort }),
  ]);
  const latest = page.isFootwear ? [...all].sort((a, b) => b.id.localeCompare(a.id)).find((p) => p.badges.includes("New")) : undefined;
  return { page, products, facets: getFacets(all, page.scope.departmentId), selected, params: flatParams(sp), latest };
}
