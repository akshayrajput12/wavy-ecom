import { z } from "zod";
import { ok, parse, route } from "@/backend/_core/http";
import { guard } from "@/backend/admin/_shared";
import { updateGateway } from "@/backend/admin/payments";
import { GatewayPatchSchema } from "@/backend/admin/schemas/ops";
import { PAYMENT_PROVIDER } from "@/types/domain";

export const PATCH = route<{ provider: string }>("admin.payments", async ({ req, params }) => {
  const actor = await guard("payments.gateway.manage");
  const provider = z.enum(PAYMENT_PROVIDER).parse(params.provider);
  return ok(await updateGateway(actor, provider, await parse(req, GatewayPatchSchema)));
});
