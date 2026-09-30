import { ok, route } from "@/backend/_core/http";
import { query } from "@/backend/admin/_shared";
import { listReturns } from "@/backend/admin/fulfilment";
import { ReturnListQuery } from "@/backend/admin/schemas/ops";

export const GET = route("admin.returns", async ({ req }) => ok(await listReturns(query(req, ReturnListQuery))));
