import { ok, parse, route } from "@/backend/_core/http";
import { bulkDeleteRoute } from "@/backend/admin/remove";
import { guard } from "@/backend/admin/_shared";
import { createCategory, listCategoryOptions, listCategoryTree } from "@/backend/admin/categories";
import { CategorySchema } from "@/backend/admin/schemas/catalog";

/** Tree by default; ?flat=1 for a depth-first picker list. */
export const GET = route("admin.categories", async ({ req }) =>
  ok(req.nextUrl.searchParams.get("flat") ? await listCategoryOptions() : await listCategoryTree()));

export const POST = route("admin.categories", async ({ req }) => {
  const actor = await guard("catalog.write");
  return ok(await createCategory(actor, await parse(req, CategorySchema)), { status: 201 });
});

/** Bulk delete `{ids}` (1-200); see backend/admin/remove.ts for how dependent data is handled. */
export const DELETE = bulkDeleteRoute("admin.categories", "categories");
