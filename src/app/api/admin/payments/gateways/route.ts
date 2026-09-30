import { ok, route } from "@/backend/_core/http";
import { listGateways } from "@/backend/admin/payments";

export const GET = route("admin.payments", async () => ok(await listGateways()));
