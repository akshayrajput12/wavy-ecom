import { ok, PUBLIC_CACHE, route } from "@/backend/_core/http";
import { listShippingMethods } from "@/backend/shipping/repo";

/** GET /api/shipping/methods?state= */
export const GET = route("shipping.methods", async ({ req }) =>
  ok(await listShippingMethods(req.nextUrl.searchParams.get("state")?.slice(0, 80) || undefined), { headers: PUBLIC_CACHE }));
