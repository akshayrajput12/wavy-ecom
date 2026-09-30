import { ok, parse, route } from "@/backend/_core/http";
import { guard, notFound } from "@/backend/admin/_shared";
import { deleteCollection, getCollection, updateCollection } from "@/backend/admin/collections";
import { CollectionPatchSchema } from "@/backend/admin/schemas/catalog";

type P = { slug: string };

export const GET = route<P>("admin.collections", async ({ params }) => ok((await getCollection(params.slug)) ?? notFound("Collection")));

export const PATCH = route<P>("admin.collections", async ({ req, params }) => {
  const actor = await guard("catalog.write");
  return ok(await updateCollection(actor, params.slug, await parse(req, CollectionPatchSchema)));
});

export const DELETE = route<P>("admin.collections", async ({ params }) => {
  const actor = await guard("catalog.write");
  return ok(await deleteCollection(actor, params.slug));
});
