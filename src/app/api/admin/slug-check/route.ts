import { ok, route } from "@/backend/_core/http";
import { guard, query } from "@/backend/admin/_shared";
import { slugTaken } from "@/backend/admin/products";
import { SlugCheckQuery } from "@/backend/admin/schemas/catalog";

/** Products use /products/<slug>; categories and collections share /collections/<slug>. */
export const GET = route("admin.catalog", async ({ req }) => {
  await guard("catalog.read");
  const q = query(req, SlugCheckQuery);
  const takenBy = await slugTaken(q.entity, q.slug, q.excludeId);
  return ok({ slug: q.slug, available: !takenBy, takenBy });
});
