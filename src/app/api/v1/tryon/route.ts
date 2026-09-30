import { ok, route } from "@/backend/_core/http";

/** Versioned, zero-cost in-house try-on capability contract. Camera inference runs on-device. */
export const GET = route("tryon.v1", async () => ok({
  apiVersion: "v1",
  mode: "on-device-live-overlay",
  provider: "mediapipe-pose-landmarker",
  uploadsPhotos: false,
  paidProviderRequired: false,
  limitations: ["2d-garment-overlay", "no-cloth-physics", "visual-preview-only"],
}));
