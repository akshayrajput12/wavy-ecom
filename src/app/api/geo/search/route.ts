import { ok, route, searchParamsObject } from "@/backend/_core/http";
import { SearchSchema } from "@/backend/geo/schema";
import { searchPlaces } from "@/backend/geo/service";

/** GET /api/geo/search?q= -> India-only places [{ label, lat, lng }] for the map search box. */
export const GET = route("geo.search", async ({ req }) => {
  const { q } = SearchSchema.parse(searchParamsObject(req.nextUrl.searchParams));
  return ok(await searchPlaces(q), { headers: { "cache-control": "private, max-age=3600" } });
});
