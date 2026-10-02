import { z } from "zod";

export const PinSchema = z.string().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit Indian pincode");

// Generous India bounding box (incl. Andaman & Nicobar, Lakshadweep, Ladakh): keeps the geocoder proxy India-only.
export const LatLngSchema = z.object({
  lat: z.coerce.number().min(6, "Location must be in India").max(37.6, "Location must be in India"),
  lng: z.coerce.number().min(68, "Location must be in India").max(97.5, "Location must be in India"),
});

export const SearchSchema = z.object({ q: z.string().trim().min(3).max(120).transform((s) => s.toLowerCase().replace(/\s+/g, " ")) });

/** ~11 m grid: the cache key and the coordinate actually sent upstream (so a cache hit is exact). */
export const roundCoord = (n: number) => Math.round(n * 1e4) / 1e4;
