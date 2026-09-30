import { ok, parse, route } from "@/backend/_core/http";
import { guard } from "@/backend/admin/_shared";
import { createCollection, listCollections } from "@/backend/admin/collections";
import { CollectionSchema } from "@/backend/admin/schemas/catalog";

export const GET = route("admin.collections", async () => ok(await listCollections()));

export const POST = route("admin.collections", async ({ req }) => {
  const actor = await guard("catalog.write");
  return ok(await createCollection(actor, await parse(req, CollectionSchema)), { status: 201 });
});
