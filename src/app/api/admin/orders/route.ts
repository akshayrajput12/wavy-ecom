import { ok, route } from "@/backend/_core/http";
import { query } from "@/backend/admin/_shared";
import { listOrders } from "@/backend/admin/orders";
import { OrderListQuery } from "@/backend/admin/schemas/ops";

export const GET = route("admin.orders", async ({ req }) => ok(await listOrders(query(req, OrderListQuery))));
