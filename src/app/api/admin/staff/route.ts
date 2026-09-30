import { ok, parse, route } from "@/backend/_core/http";
import { guard } from "@/backend/admin/_shared";
import { inviteStaff, listStaff } from "@/backend/admin/customers";
import { StaffInviteSchema } from "@/backend/admin/schemas/settings";

export const GET = route("admin.staff", async () => ok(await listStaff()));

/** Invite (or re-send a pending invite). */
export const POST = route("admin.staff", async ({ req }) => {
  const actor = await guard("staff.manage");
  return ok(await inviteStaff(actor, await parse(req, StaffInviteSchema)), { status: 201 });
});
