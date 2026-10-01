import { ok, parse, route } from "@/backend/_core/http";
import { bulkDeleteRoute } from "@/backend/admin/remove";
import { guard } from "@/backend/admin/_shared";
import { createCollection, listCollections } from "@/backend/admin/collections";
import { CollectionSchema } from "@/backend/admin/schemas/catalog";

export const GET = route("admin.collections", async () => ok(await listCollections()));

export const POST = route("admin.collections", async ({ req }) => {
  const actor = await guard("catalog.write");
  return ok(await createCollection(actor, await parse(req, CollectionSchema)), { status: 201 });
});

/** Bulk delete `{ids}` (1-200); see backend/admin/remove.ts for how dependent data is handled. */
export const DELETE = bulkDeleteRoute("admin.collections", "collections");
