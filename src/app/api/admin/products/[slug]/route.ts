import { z } from "zod";
import { ok, parse, route } from "@/backend/_core/http";
import { guard, notFound, query } from "@/backend/admin/_shared";
import { getProduct } from "@/backend/admin/products";
import { removeProduct, saveProduct } from "@/backend/admin/product-save";
import { ProductUpsertSchema } from "@/backend/admin/schemas/catalog";

type P = { slug: string };

export const GET = route<P>("admin.products", async ({ params }) => ok((await getProduct(params.slug)) ?? notFound("Product")));

/** Full document replace (variants / media / collections are synced to the payload). */
export const PATCH = route<P>("admin.products", async ({ req, params }) => {
  const actor = await guard("catalog.write");
  return ok(await saveProduct(actor, await parse(req, ProductUpsertSchema), params.slug));
});

/** ?mode=archive (default, needs catalog.publish) | delete (blocked once the product has orders). */
export const DELETE = route<P>("admin.products", async ({ req, params }) => {
  const actor = await guard("catalog.write");
  const { mode } = query(req, z.object({ mode: z.enum(["archive", "delete"]).default("archive") }));
  return ok(await removeProduct(actor, params.slug, mode));
});
