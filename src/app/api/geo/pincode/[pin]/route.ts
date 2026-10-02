import { ApiError, ok, route, STATIC_CACHE } from "@/backend/_core/http";
import { PinSchema } from "@/backend/geo/schema";
import { lookupPincode } from "@/backend/geo/service";

/** GET /api/geo/pincode/302012 -> { pin, state, district, localities[] } */
export const GET = route<{ pin: string }>("geo.pincode", async ({ params }) => {
  const pin = PinSchema.safeParse(params.pin);
  if (!pin.success) throw new ApiError(400, "invalid_pincode", "Enter a valid 6-digit Indian pincode");
  return ok(await lookupPincode(pin.data), { headers: STATIC_CACHE });
});
