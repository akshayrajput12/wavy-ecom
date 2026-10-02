/**
 * Pure mappers for the free geo providers. No server-only: the account/checkout
 * zod schemas reuse `canonicalState`.
 *   India Post  https://api.postalpincode.in/pincode/{pin}   -> PincodeInfo
 *   Nominatim   /reverse?format=jsonv2&addressdetails=1      -> AddressFields
 *   Photon      /api/?q=                                     -> Place[]
 */
import { z } from "zod";
import { INDIAN_STATES } from "@/data/copy";

export type IndianState = (typeof INDIAN_STATES)[number];
export type PincodeInfo = { pin: string; state: IndianState | null; district: string | null; localities: string[] };
export type AddressFields = { line1?: string; line2?: string; landmark?: string; city?: string; state?: IndianState; postalCode?: string };
export type Place = { label: string; lat: number; lng: number };

const key = (s: string) => s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z]+/g, " ").trim();
// India Post and OSM still use some pre-2020 / old spellings.
const ALIASES: Record<string, IndianState> = {
  "andaman and nicobar": "Andaman and Nicobar Islands", chattisgarh: "Chhattisgarh", pondicherry: "Puducherry",
  orissa: "Odisha", uttaranchal: "Uttarakhand", "nct of delhi": "Delhi", "national capital territory of delhi": "Delhi",
  "daman and diu": "Dadra and Nagar Haveli and Daman and Diu", "dadra and nagar haveli": "Dadra and Nagar Haveli and Daman and Diu",
};
const BY_KEY = new Map<string, IndianState>([...INDIAN_STATES.map((s) => [key(s), s] as const), ...Object.entries(ALIASES)]);

/** Any spelling of a state/UT -> the canonical name (= GST_STATES name, so invoices resolve the state code). */
export const canonicalState = (raw?: string | null): IndianState | undefined => (raw ? BY_KEY.get(key(raw)) : undefined);

const LADAKH = /^(leh|kargil|leh ladakh)$/i; // India Post still files Ladakh PINs under "Jammu & Kashmir"
const clean = (s: string) => s.replace(/\s*\([^)]*\)\s*$/, "").replace(/\s+/g, " ").trim(); // "Hamirpur(HP)" -> "Hamirpur"
const officeName = (s: string) => clean(s).replace(/\s+(g\.?p\.?o|[hsbp]\.?o)\.?$/i, ""); // "Jhotwara S.O", "Elephanta Caves Po"

/** Most frequent value; ties keep the first seen. */
function mode<T>(xs: T[]): T | undefined {
  const n = new Map<T, number>();
  for (const x of xs) n.set(x, (n.get(x) ?? 0) + 1);
  let best: T | undefined;
  for (const [x, c] of n) if (best === undefined || c > n.get(best)!) best = x;
  return best;
}

const IndiaPost = z.array(z.object({
  Status: z.string(),
  PostOffice: z.array(z.object({ Name: z.string(), District: z.string().nullish(), State: z.string().nullish() })).nullish(),
})).min(1);

/** India Post body -> { pin, state, district, localities }. Null when the PIN has no post offices. */
export function normalisePincode(pin: string, body: unknown): PincodeInfo | null {
  const parsed = IndiaPost.safeParse(body);
  const offices = parsed.success ? parsed.data[0].PostOffice ?? [] : [];
  if (!offices.length) return null;
  const rows = offices.map((o) => {
    const district = o.District ? clean(o.District) : null;
    const state = district && LADAKH.test(district) ? "Ladakh" : canonicalState(o.State) ?? null;
    return { district, state };
  });
  // Border PINs (e.g. 396230) list offices in two states: the majority wins.
  const state = mode(rows.map((r) => r.state).filter((s): s is IndianState => !!s)) ?? null;
  const district = mode(rows.filter((r) => !state || r.state === state).map((r) => r.district).filter((d): d is string => !!d)) ?? null;
  const localities = [...new Set(offices.map((o) => officeName(o.Name)).filter(Boolean))];
  return { pin, state, district, localities };
}

const Nominatim = z.object({
  name: z.string().nullish(),
  category: z.string().nullish(),
  address: z.record(z.string(), z.string()).nullish(),
});
const LANDMARK_KEYS = ["amenity", "leisure", "tourism", "shop", "historic", "office", "building", "man_made"];
const cityName = (s: string) => s.replace(/\s+(municipal corporation|city corporation|corporation|municipality|district)$/i, "").trim();

/** Nominatim reverse result -> address form fields. Missing parts stay undefined (never invented). */
export function toAddressFields(body: unknown): AddressFields {
  const parsed = Nominatim.safeParse(body);
  if (!parsed.success || !parsed.data.address) return {};
  const a = parsed.data.address;
  const { name, category } = parsed.data;
  const line1 = [a.house_number ?? a.house_name, a.road ?? (category === "highway" ? name : undefined)].filter(Boolean).join(" ") || undefined;
  const area = [a.neighbourhood ?? a.quarter ?? a.residential, a.suburb ?? a.village ?? a.hamlet]
    .map((s) => s?.replace(/^ward\s*(no\.?\s*)?\d+\s*/i, "").trim()).filter((s): s is string => !!s);
  const landmark = (name && category !== "highway" && name !== a.road ? name : undefined) ?? LANDMARK_KEYS.map((k) => a[k]).find(Boolean);
  const city = [a.city, a.town, a.state_district, a.county].find(Boolean);
  const pin = a.postcode?.replace(/\s/g, "");
  return {
    line1,
    line2: [...new Set(area)].join(", ") || undefined,
    landmark,
    city: city ? cityName(city) : undefined,
    state: canonicalState(a.state),
    postalCode: pin && /^[1-9]\d{5}$/.test(pin) ? pin : undefined,
  };
}

const Photon = z.object({
  features: z.array(z.object({
    geometry: z.object({ coordinates: z.tuple([z.number(), z.number()]) }),
    properties: z.record(z.string(), z.unknown()),
  })),
});

/** Photon search -> India-only places with a readable one-line label. */
export function photonPlaces(body: unknown): Place[] {
  const parsed = Photon.safeParse(body);
  if (!parsed.success) return [];
  const seen = new Set<string>();
  return parsed.data.features.flatMap(({ geometry, properties: p }) => {
    if (p.countrycode !== "IN") return [];
    const s = (k: string) => (typeof p[k] === "string" ? (p[k] as string) : undefined);
    const parts = [s("name"), s("street"), s("district"), s("city") ? cityName(s("city")!) : s("county"), s("state"), s("postcode")];
    const label = [...new Set(parts.filter(Boolean))].join(", ");
    if (!label || seen.has(label)) return [];
    seen.add(label);
    return [{ label, lng: geometry.coordinates[0], lat: geometry.coordinates[1] }];
  });
}
