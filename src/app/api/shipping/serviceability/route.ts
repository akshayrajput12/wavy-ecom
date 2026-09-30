import { z } from "zod";
import { ApiError, ok, route } from "@/backend/_core/http";
import { checkServiceability } from "@/backend/shipping/serviceability";

const Pincode = z.string().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit Indian pincode");

export const GET = route("shipping.serviceability", async ({ req }) => {
  const raw = req.nextUrl.searchParams.get("pincode");
  const parsed = Pincode.safeParse(raw);
  if (!parsed.success) throw new ApiError(400, "invalid_pincode", "Enter a valid 6-digit Indian pincode");
  const data = await checkServiceability(parsed.data);
  return ok(data, { headers: { "cache-control": "private, max-age=60" } });
});
