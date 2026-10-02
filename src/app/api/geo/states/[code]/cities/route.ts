import { ApiError, ok, route, STATIC_CACHE } from "@/backend/_core/http";
import { canonicalState } from "@/backend/geo/normalise";
import { citiesOf } from "@/backend/geo/service";
import { GST_STATES } from "@/backend/invoices/gst";

/** GET /api/geo/states/08/cities or /api/geo/states/Rajasthan/cities -> { state, cities[] } */
export const GET = route<{ code: string }>("geo.cities", async ({ params }) => {
  const raw = params.code.length <= 2 ? GST_STATES[params.code.padStart(2, "0")] : safeDecode(params.code);
  const state = canonicalState(raw);
  if (!state) throw new ApiError(404, "unknown_state", "Unknown state");
  return ok({ state, cities: citiesOf(state) }, { headers: STATIC_CACHE });
});

function safeDecode(s: string) {
  try { return decodeURIComponent(s); } catch { return s; }
}
