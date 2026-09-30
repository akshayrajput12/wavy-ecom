import { ok, route } from "@/backend/_core/http";
import { guard } from "@/backend/admin/_shared";
import { duplicateProduct } from "@/backend/admin/product-save";

export const POST = route<{ slug: string }>("admin.products", async ({ params }) => {
  const actor = await guard("catalog.write");
  return ok(await duplicateProduct(actor, params.slug), { status: 201 });
});
