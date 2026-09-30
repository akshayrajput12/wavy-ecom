import { ok, parse, route } from "@/backend/_core/http";
import { guard, notFound } from "@/backend/admin/_shared";
import { isResource, reorderResource, RESOURCES } from "@/backend/admin/crud";
import { ReorderSchema } from "@/backend/admin/schemas/content";

/** {ids} in the new order -> sort_order 0..n (faqs, testimonials, home-sections, shipping-methods). */
export const POST = route<{ resource: string }>("admin.crud", async ({ req, params }) => {
  const name = isResource(params.resource) ? params.resource : notFound(`Admin resource "${params.resource}"`);
  const actor = await guard(RESOURCES[name].write);
  const { ids } = await parse(req, ReorderSchema);
  return ok(await reorderResource(actor, name, ids));
});
