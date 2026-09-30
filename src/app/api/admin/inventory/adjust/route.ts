import { ok, parse, route } from "@/backend/_core/http";
import { guard } from "@/backend/admin/_shared";
import { adjustStock } from "@/backend/admin/inventory";
import { AdjustSchema } from "@/backend/admin/schemas/ops";

export const POST = route("admin.inventory", async ({ req }) => {
  const actor = await guard("inventory.write");
  return ok(await adjustStock(actor, await parse(req, AdjustSchema)));
});
