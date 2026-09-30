import { z } from "zod";
import { ApiError, route } from "@/backend/_core/http";

// Kept as a compatibility path. Generative photo try-on is intentionally off:
// the free first-party feature runs on-device and does not upload photos.
export const GET = route("tryon", async ({ req }) => {
  z.string().min(1).max(200).parse(req.nextUrl.searchParams.get("id"));
  throw new ApiError(410, "photo_generation_disabled", "Photo jobs are disabled. See /api/v1/tryon for the in-house on-device API.");
});
export const POST = route("tryon", async ({ req }) => {
  const form = await req.formData().catch(() => {
    throw new ApiError(400, "bad_form", "Expected multipart/form-data");
  });
  z.object({
    productId: z.string().min(1).max(120),
    image: z.instanceof(File).refine((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type)).refine((file) => file.size > 0 && file.size <= 8 * 1024 * 1024),
  }).parse({ productId: form.get("productId"), image: form.get("image") });
  throw new ApiError(410, "photo_generation_disabled", "Photo generation is disabled. The on-device try-on does not upload images.");
});
