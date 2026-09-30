import { ok, route } from "@/backend/_core/http";
import { getStoreSettings } from "@/backend/admin/settings";

export const GET = route("admin.settings", async () => ok(await getStoreSettings()));
