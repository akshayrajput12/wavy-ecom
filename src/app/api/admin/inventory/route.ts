import { ok, route } from "@/backend/_core/http";
import { query } from "@/backend/admin/_shared";
import { listInventory } from "@/backend/admin/inventory";
import { InventoryListQuery } from "@/backend/admin/schemas/ops";

export const GET = route("admin.inventory", async ({ req }) => ok(await listInventory(query(req, InventoryListQuery))));
