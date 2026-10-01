import type { ZodType } from "zod";
import { ok, parse, route } from "@/backend/_core/http";
import { guard, notFound } from "@/backend/admin/_shared";
import { createResource, isResource, listResource, RESOURCES } from "@/backend/admin/crud";
import { removeMany } from "@/backend/admin/remove";
import { BulkDeleteSchema } from "@/backend/admin/schemas/content";

/** faqs | testimonials | pages | home-sections | seo-overrides | redirects | shipping-zones | shipping-methods */
type P = { resource: string };
const spec = (name: string) => (isResource(name) ? name : notFound(`Admin resource "${name}"`));

export const GET = route<P>("admin.crud", async ({ params }) => ok(await listResource(spec(params.resource))));

export const POST = route<P>("admin.crud", async ({ req, params }) => {
  const name = spec(params.resource);
  const actor = await guard(RESOURCES[name].write);
  return ok(await createResource(actor, name, await parse(req, RESOURCES[name].create as ZodType<object>)), { status: 201 });
});

/** Bulk delete `{ids}` (1-200) -> `{deleted, archived}` (shipping rows used by orders are switched off, not deleted). */
export const DELETE = route<P>("admin.crud", async ({ req, params }) => {
  const name = spec(params.resource);
  const actor = await guard(RESOURCES[name].write);
  return ok(await removeMany(actor, name, (await parse(req, BulkDeleteSchema)).ids));
});
