import { requireUser } from "@/backend/_core/auth";
import { ok, parse, route } from "@/backend/_core/http";
import { CreateReturnSchema } from "@/backend/returns/schema";
import { createReturnRequest, listMyReturns } from "@/backend/returns/service";

/** GET /api/returns -> ReturnRequest[] (signed in) */
export const GET = route("returns", async () => ok(await listMyReturns(await requireUser())));

/** POST /api/returns { orderNumber, reason, resolution?, customerNote?, items[{orderItemId, quantity, reason?}] } */
export const POST = route("returns", async ({ req }) => {
  const session = await requireUser();
  return ok(await createReturnRequest(session, await parse(req, CreateReturnSchema)), { status: 201 });
});
