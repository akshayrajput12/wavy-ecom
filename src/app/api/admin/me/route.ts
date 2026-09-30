import { ApiError, ok, route } from "@/backend/_core/http";
import { ROLE_PERMISSIONS } from "@/backend/_core/permissions";
import { staffSession } from "@/backend/admin/_shared";

/** Current staff member + their permission list (UI gating). */
export const GET = route("admin.me", async () => {
  const me = await staffSession();
  if (!me) throw new ApiError(401, "unauthenticated", "Sign in with a staff account");
  return ok({ ...me, permissions: ROLE_PERMISSIONS[me.role] });
});
