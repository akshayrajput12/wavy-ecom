import { ok, parse, route } from "@/backend/_core/http";
import { guard, query } from "@/backend/admin/_shared";
import { listProducts } from "@/backend/admin/products";
import { saveProduct } from "@/backend/admin/product-save";
import { ProductListQuery, ProductUpsertSchema } from "@/backend/admin/schemas/catalog";

export const GET = route("admin.products", async ({ req }) => ok(await listProducts(query(req, ProductListQuery))));

export const POST = route("admin.products", async ({ req }) => {
  const actor = await guard("catalog.write");
  return ok(await saveProduct(actor, await parse(req, ProductUpsertSchema)), { status: 201 });
});
