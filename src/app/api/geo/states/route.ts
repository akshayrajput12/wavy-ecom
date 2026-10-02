import { ok, route, STATIC_CACHE } from "@/backend/_core/http";
import { stateCodeOf } from "@/backend/invoices/gst";
import { INDIAN_STATES } from "@/data/copy";

/** GET /api/geo/states -> [{ name, code }] (code = GST state code, also accepted by /states/[code]/cities). */
export const GET = route("geo.states", async () =>
  ok(INDIAN_STATES.map((name) => ({ name, code: stateCodeOf(name) ?? null })), { headers: STATIC_CACHE }));
