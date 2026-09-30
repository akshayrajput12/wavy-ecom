import type { ZodType } from "zod";
import { ok, parse, route } from "@/backend/_core/http";
import { guard, notFound } from "@/backend/admin/_shared";
import { deleteResource, getResource, isResource, RESOURCES, updateResource } from "@/backend/admin/crud";

type P = { resource: string; id: string };
const spec = (name: string) => (isResource(name) ? name : notFound(`Admin resource "${name}"`));

export const GET = route<P>("admin.crud", async ({ params }) =>
  ok((await getResource(spec(params.resource), params.id)) ?? notFound(params.resource)));

export const PATCH = route<P>("admin.crud", async ({ req, params }) => {
  const name = spec(params.resource);
  const actor = await guard(RESOURCES[name].write);
  return ok(await updateResource(actor, name, params.id, await parse(req, RESOURCES[name].patch as ZodType<object>)));
});

export const DELETE = route<P>("admin.crud", async ({ params }) => {
  const name = spec(params.resource);
  const actor = await guard(RESOURCES[name].write);
  return ok(await deleteResource(actor, name, params.id));
});
