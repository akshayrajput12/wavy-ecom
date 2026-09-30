import { ok, route } from "@/backend/_core/http";
import { getDashboard } from "@/backend/admin/dashboard";

export const GET = route("admin.dashboard", async () => ok(await getDashboard()));
