import { ok, route, searchParamsObject } from "@/backend/_core/http";
import { LatLngSchema, roundCoord } from "@/backend/geo/schema";
import { reverseGeocode } from "@/backend/geo/service";

/** GET /api/geo/reverse?lat=&lng= -> address fields for the map pin. Private cache: a location is personal. */
export const GET = route("geo.reverse", async ({ req }) => {
  const { lat, lng } = LatLngSchema.parse(searchParamsObject(req.nextUrl.searchParams));
  return ok(await reverseGeocode(roundCoord(lat), roundCoord(lng)), { headers: { "cache-control": "private, max-age=3600" } });
});
