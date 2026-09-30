import { ok, parse, route } from "@/backend/_core/http";
import { guard } from "@/backend/admin/_shared";
import { updateIntegration } from "@/backend/admin/settings";
import { IntegrationPatchSchema } from "@/backend/admin/schemas/settings";

export const PATCH = route<{ id: string }>("admin.integrations", async ({ req, params }) => {
  const actor = await guard("integrations.manage");
  return ok(await updateIntegration(actor, params.id, await parse(req, IntegrationPatchSchema)));
});
