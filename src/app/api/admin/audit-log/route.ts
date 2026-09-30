import { ok, route } from "@/backend/_core/http";
import { query } from "@/backend/admin/_shared";
import { listAuditLog } from "@/backend/admin/settings";
import { AuditQuery } from "@/backend/admin/schemas/settings";

export const GET = route("admin.audit", async ({ req }) => ok(await listAuditLog(query(req, AuditQuery))));
