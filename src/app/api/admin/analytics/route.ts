import { ok, route } from "@/backend/_core/http";
import { query } from "@/backend/admin/_shared";
import { getAnalytics } from "@/backend/admin/dashboard";
import { AnalyticsQuery } from "@/backend/admin/schemas/settings";

export const GET = route("admin.analytics", async ({ req }) => ok(await getAnalytics(query(req, AnalyticsQuery))));
