import { ok, parse, route } from "@/backend/_core/http";
import { guard } from "@/backend/admin/_shared";
import { actOnReturn } from "@/backend/admin/fulfilment";
import { ReturnActionSchema } from "@/backend/admin/schemas/ops";

/** {action: approve|reject|schedule_pickup|receive|close, ...}. */
export const PATCH = route<{ id: string }>("admin.returns", async ({ req, params }) => {
  const actor = await guard("returns.write");
  return ok(await actOnReturn(actor, params.id, await parse(req, ReturnActionSchema)));
});
