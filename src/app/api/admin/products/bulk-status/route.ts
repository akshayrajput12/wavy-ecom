import { ok, parse, route } from "@/backend/_core/http";
import { guard } from "@/backend/admin/_shared";
import { bulkProductStatus } from "@/backend/admin/product-save";
import { BulkStatusSchema } from "@/backend/admin/schemas/catalog";

export const POST = route("admin.products", async ({ req }) => {
  const actor = await guard("catalog.publish");
  const { ids, status } = await parse(req, BulkStatusSchema);
  return ok(await bulkProductStatus(actor, ids, status));
});
