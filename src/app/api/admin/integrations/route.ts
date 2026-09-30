import { ok, route } from "@/backend/_core/http";
import { listIntegrations } from "@/backend/admin/settings";

export const GET = route("admin.integrations", async () => ok(await listIntegrations()));
