import { ok, route } from "@/backend/_core/http";
import { query } from "@/backend/admin/_shared";
import { listMovements } from "@/backend/admin/inventory";
import { MovementsQuery } from "@/backend/admin/schemas/ops";

export const GET = route<{ variantId: string }>("admin.inventory", async ({ req, params }) =>
  ok(await listMovements(params.variantId, query(req, MovementsQuery))));
