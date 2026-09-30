import { z } from "zod";
import { requireUser } from "@/backend/_core/auth";
import { ok, parse, route } from "@/backend/_core/http";
import { cancelMyOrder } from "@/backend/orders/repo";

/** POST /api/orders/:number/cancel { reason? } (signed-in owner; pending_payment|paid|processing only) */
export const POST = route<{ number: string }>("orders.cancel", async ({ req, params }) => {
  const session = await requireUser();
  const { reason } = await parse(req, z.object({ reason: z.string().trim().max(200).optional() }));
  return ok(await cancelMyOrder(session, params.number, reason));
});
