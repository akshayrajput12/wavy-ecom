import { ok, route } from "@/backend/_core/http";
import { searchSuggestions } from "@/backend/catalog/repo";

/** GET /api/search/suggest?q= */
export const GET = route("catalog.suggest", async ({ req }) => {
  const q = (req.nextUrl.searchParams.get("q") ?? "").slice(0, 100);
  return ok(await searchSuggestions(q), { headers: { "cache-control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300" } });
});
