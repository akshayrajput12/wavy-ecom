import { z } from "zod";
import { ok, parse, route } from "@/backend/_core/http";
import { guard, notFound, query } from "@/backend/admin/_shared";
import { deleteCategory, getCategory, updateCategory } from "@/backend/admin/categories";
import { CategoryPatchSchema } from "@/backend/admin/schemas/catalog";

type P = { slug: string };

export const GET = route<P>("admin.categories", async ({ params }) => ok((await getCategory(params.slug)) ?? notFound("Category")));

export const PATCH = route<P>("admin.categories", async ({ req, params }) => {
  const actor = await guard("catalog.write");
  return ok(await updateCategory(actor, params.slug, await parse(req, CategoryPatchSchema)));
});

/** 409 category_in_use {productCount, childCount} unless ?reassignTo=<category slug>. */
export const DELETE = route<P>("admin.categories", async ({ req, params }) => {
  const actor = await guard("catalog.write");
  const { reassignTo } = query(req, z.object({ reassignTo: z.string().min(1).optional() }));
  return ok(await deleteCategory(actor, params.slug, reassignTo));
});
