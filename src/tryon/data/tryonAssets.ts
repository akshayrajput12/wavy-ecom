import type { Calibration, GarmentType } from "../engine/garmentFit";

export interface TryOnAsset {
  /** Transparent, front-facing flat-lay overlay under /public/tryon (PNG or SVG). */
  src: string;
  type: GarmentType;
  calibration: Calibration;
}

// Calibration presets tuned to the placeholder silhouettes. Real product overlays usually only
// need widthScale / offsetY nudged — see docs/tryon/IMPLEMENTATION.md.
const TEE: TryOnAsset = {
  src: "/tryon/tee.svg",
  type: "top",
  calibration: { widthScale: 2.0, lengthScale: 1.3, offsetY: -0.12, offsetX: 0 },
};
const HOODIE: TryOnAsset = {
  src: "/tryon/hoodie.svg",
  type: "top",
  calibration: { widthScale: 2.1, lengthScale: 1.4, offsetY: -0.2, offsetX: 0 },
};
const TROUSERS: TryOnAsset = {
  src: "/tryon/trousers.svg",
  type: "bottom",
  calibration: { widthScale: 1.9, lengthScale: 1.08, offsetY: -0.06, offsetX: 0, lengthTo: "ankles" },
};

/** Keyed by product id or slug. */
export const tryOnAssets: Record<string, TryOnAsset> = {
  // Product ids are stable in the demo catalog; slug aliases keep the lookup
  // working when real catalog records use slugs instead.
  p_001: TEE, "essential-crew-tee": TEE,
  p_002: TEE, "essential-pocket-tee": TEE,
  p_004: TEE, "heavyweight-boxy-tee": TEE,
  p_005: HOODIE, "daybreak-hoodie": HOODIE,
  p_006: HOODIE, "loopback-crew-sweat": HOODIE,
  p_007: HOODIE, "field-overshirt": HOODIE,
  p_008: TEE, "linen-camp-shirt": TEE,
  p_009: TEE, "oxford-button-down": TEE,
  p_010: TROUSERS, "sculpted-knee-trouser": TROUSERS,
  p_012: TROUSERS, "ripstop-cargo": TROUSERS,
  p_013: HOODIE, "monsoon-shell-jacket": HOODIE,
  p_014: HOODIE, "merino-crew-knit": HOODIE,
};

/** Returns null for products without a deliberately registered overlay. */
export function getTryOnAsset(product: { id: string; slug: string }): TryOnAsset | null {
  return tryOnAssets[product.id] ?? tryOnAssets[product.slug] ?? null;
}
