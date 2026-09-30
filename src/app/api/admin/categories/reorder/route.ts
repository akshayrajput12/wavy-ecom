import { ok, parse, route } from "@/backend/_core/http";
import { guard } from "@/backend/admin/_shared";
import { reorderCategories } from "@/backend/admin/categories";
import { CategoryReorderSchema } from "@/backend/admin/schemas/catalog";

export const POST = route("admin.categories", async ({ req }) => {
  const actor = await guard("catalog.write");
  return ok(await reorderCategories(actor, await parse(req, CategoryReorderSchema)));
});
