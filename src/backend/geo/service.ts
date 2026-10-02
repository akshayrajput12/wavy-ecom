import "server-only";
import { cached, TAGS } from "@/backend/_core/cache";
import { ApiError } from "@/backend/_core/http";
import { siteConfig } from "@/lib/site";
import districts from "./districts.json";
import { canonicalState, normalisePincode, photonPlaces, toAddressFields, type IndianState } from "./normalise";

/**
 * Free, keyless geo lookups, always server-side (cached, rate-limited in route(), never exposes the client IP upstream).
 *   India Post (api.postalpincode.in)    pincode -> state, district, post-office localities
 *   Nominatim (OSMF)                     reverse geocode; usage policy: identifying UA, <= 1 req/s, cache results
 *   Photon (photon.komoot.io)            forward search; built for search-as-you-type (Nominatim forbids autocomplete)
 *   districts.json                       states -> districts, MIT, github.com/KTBsomen/Indian-state-district-json (igod.gov.in)
 * Failures are thrown (so never cached) as 503 geo_unavailable; the form stays fully manual.
 * Coordinates are never logged: route() logs the pathname only, and nothing here logs.
 */
const DAY = 86_400;
const UA = `wavy-store/1.0 (+${siteConfig.url})`;

async function getJson(url: string, timeoutMs: number): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "user-agent": UA, accept: "application/json", "accept-language": "en" },
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  }).catch(() => null);
  if (!res?.ok) throw new ApiError(503, "geo_unavailable", "Location lookup is unavailable right now. Please enter the address manually.");
  return res.json().catch(() => {
    throw new ApiError(503, "geo_unavailable", "Location lookup is unavailable right now. Please enter the address manually.");
  });
}

export const lookupPincode = cached("geo.pincode.v2", [TAGS.geo], async (pin: string) => {
  const info = normalisePincode(pin, await getJson(`https://api.postalpincode.in/pincode/${pin}`, 6000));
  // Not cached (thrown): India Post occasionally answers "No records" for a real PIN under load.
  if (!info) throw new ApiError(404, "pincode_not_found", "We couldn't find this pincode.");
  return info;
}, 30 * DAY);

// ponytail: per-instance 1 req/s gate (N instances = N req/s); a shared queue or a self-hosted Nominatim when traffic grows.
let nextSlot = 0;
async function nominatimSlot() {
  const now = Date.now();
  const at = Math.max(now, nextSlot);
  if (at - now > 3000) throw new ApiError(503, "geo_busy", "Location lookup is busy. Try again in a moment.");
  nextSlot = at + 1000;
  if (at > now) await new Promise((r) => setTimeout(r, at - now));
}

/** lat/lng are already rounded by the route (roundCoord), so the cache key is the upstream query. */
export const reverseGeocode = cached("geo.reverse.v1", [TAGS.geo], async (lat: number, lng: number) => {
  await nominatimSlot();
  const q = new URLSearchParams({ lat: String(lat), lon: String(lng), format: "jsonv2", addressdetails: "1", zoom: "18", "accept-language": "en" });
  return toAddressFields(await getJson(`https://nominatim.openstreetmap.org/reverse?${q}`, 6000));
}, 7 * DAY);

export const searchPlaces = cached("geo.search.v1", [TAGS.geo], async (q: string) => {
  const p = new URLSearchParams({ q, limit: "8", lang: "en", bbox: "68,6,97.5,37.6" });
  return photonPlaces(await getJson(`https://photon.komoot.io/api/?${p}`, 5000));
}, DAY);

const CITIES = new Map((districts as { state: string; districts: string[] }[]).map((d) => [canonicalState(d.state), [...d.districts].sort()]));

/** Districts of a state, alphabetical. The city field also accepts free text for towns not listed. */
export const citiesOf = (state: IndianState): string[] => CITIES.get(state) ?? [];
