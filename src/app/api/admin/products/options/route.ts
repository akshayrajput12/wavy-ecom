import { ok, route } from "@/backend/_core/http";
import { listProductOptions } from "@/backend/admin/products";

/** {id, name, slug, status}[] for pickers. */
export const GET = route("admin.products", async () => ok(await listProductOptions()));
