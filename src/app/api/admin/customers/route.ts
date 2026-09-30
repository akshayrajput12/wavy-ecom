import { ok, route } from "@/backend/_core/http";
import { query } from "@/backend/admin/_shared";
import { listCustomers } from "@/backend/admin/customers";
import { CustomerListQuery } from "@/backend/admin/schemas/settings";

export const GET = route("admin.customers", async ({ req }) => ok(await listCustomers(query(req, CustomerListQuery))));
