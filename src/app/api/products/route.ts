import { ok, PUBLIC_CACHE, route } from "@/backend/_core/http";
import { listProducts } from "@/backend/catalog/repo";
import { productQueryFrom } from "@/backend/catalog/schema";

/** GET /api/products?category=&collection=&opt=Color:Black&brand=&min=&max=&inStock=1&sort=&q=&page=&pageSize= */
export const GET = route("catalog", async ({ req }) => ok(await listProducts(productQueryFrom(req.nextUrl.searchParams)), { headers: PUBLIC_CACHE }));
