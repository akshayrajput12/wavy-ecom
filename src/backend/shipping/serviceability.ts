import "server-only";
import { ApiError } from "@/backend/_core/http";

const API = "https://apiv2.shiprocket.in/v1/external";
const TOKEN_TTL = 9 * 24 * 60 * 60 * 1000;
const RESULT_TTL = 10 * 60 * 1000;

let tokenCache: { value: string; expiresAt: number } | null = null;
let tokenRequest: Promise<string> | null = null;
const resultCache = new Map<string, { expiresAt: number; value: Serviceability }>();

export interface Serviceability {
  serviceable: boolean;
  prepaidAvailable: boolean;
  codAvailable: boolean;
  estimatedDays: { min: number; max: number } | null;
}

type Courier = { cod?: number | string | boolean; estimated_delivery_days?: number | string; etd?: string };
type CourierResponse = { data?: { available_courier_companies?: Courier[] } };

function credentials() {
  const email = process.env.SHIPROCKET_API_EMAIL ?? process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_API_PASSWORD ?? process.env.SHIPROCKET_PASSWORD;
  const pickup = process.env.SHIPROCKET_PICKUP_POSTCODE;
  if (!email || !password || !pickup || !/^[1-9]\d{5}$/.test(pickup)) {
    throw new ApiError(503, "shipping_unavailable", "Live delivery checking is not configured yet.");
  }
  return { email, password, pickup };
}

async function getToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && tokenCache && tokenCache.expiresAt > Date.now()) return tokenCache.value;
  if (tokenRequest) return tokenRequest;
  tokenRequest = (async () => {
    const { email, password } = credentials();
    const response = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    }).catch(() => null);
    if (!response?.ok) throw new ApiError(503, "shipping_unavailable", "Delivery availability could not be checked. Try again shortly.");
    const body = (await response.json().catch(() => null)) as { token?: unknown } | null;
    if (typeof body?.token !== "string" || !body.token) throw new ApiError(503, "shipping_unavailable", "Delivery availability could not be checked. Try again shortly.");
    tokenCache = { value: body.token, expiresAt: Date.now() + TOKEN_TTL };
    return body.token;
  })();
  try {
    return await tokenRequest;
  } finally {
    tokenRequest = null;
  }
}

function hasCourier(rows: Courier[]) {
  return rows.length > 0;
}

function daysFrom(rows: Courier[]) {
  const estimates = rows.flatMap((row) => {
    const text = String(row.estimated_delivery_days ?? "");
    const values = text.match(/\d+(?:\.\d+)?/g)?.map(Number).filter((n) => Number.isFinite(n) && n > 0) ?? [];
    return values.length ? [[Math.round(Math.min(...values)), Math.round(Math.max(...values))] as [number, number]] : [];
  });
  if (!estimates.length) return null;
  return { min: Math.min(...estimates.map((x) => x[0])), max: Math.max(...estimates.map((x) => x[1])) };
}

async function fetchCouriers(pincode: string, cod: 0 | 1): Promise<Courier[]> {
  const { pickup } = credentials();
  const query = new URLSearchParams({ pickup_postcode: pickup, delivery_postcode: pincode, weight: "0.5", cod: String(cod) });
  let token = await getToken();
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch(`${API}/courier/serviceability/?${query}`, {
      headers: { authorization: `Bearer ${token}`, accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    }).catch(() => null);
    if (response?.status === 401 && attempt === 0) {
      tokenCache = null;
      token = await getToken(true);
      continue;
    }
    if (!response?.ok) throw new ApiError(503, "shipping_unavailable", "Delivery availability could not be checked. Try again shortly.");
    const body = (await response.json().catch(() => null)) as CourierResponse | null;
    return body?.data?.available_courier_companies ?? [];
  }
  throw new ApiError(503, "shipping_unavailable", "Delivery availability could not be checked. Try again shortly.");
}

export async function checkServiceability(pincode: string): Promise<Serviceability> {
  const { pickup } = credentials();
  const key = `${pickup}:${pincode}:0.5kg`;
  const cached = resultCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const [prepaid, cod] = await Promise.all([fetchCouriers(pincode, 0), fetchCouriers(pincode, 1)]);
  const result: Serviceability = {
    serviceable: hasCourier(prepaid) || hasCourier(cod),
    prepaidAvailable: hasCourier(prepaid),
    codAvailable: hasCourier(cod) && cod.some((courier) => courier.cod === 1 || courier.cod === "1" || courier.cod === true),
    estimatedDays: daysFrom([...prepaid, ...cod]),
  };
  resultCache.set(key, { value: result, expiresAt: Date.now() + RESULT_TTL });
  if (resultCache.size > 500) {
    for (const [cacheKey, entry] of resultCache) if (entry.expiresAt <= Date.now()) resultCache.delete(cacheKey);
    if (resultCache.size > 500) resultCache.delete(resultCache.keys().next().value!);
  }
  return result;
}
