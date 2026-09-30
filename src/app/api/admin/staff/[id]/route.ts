import { ok, parse, route } from "@/backend/_core/http";
import { guard } from "@/backend/admin/_shared";
import { removeStaff, updateStaff } from "@/backend/admin/customers";
import { StaffPatchSchema } from "@/backend/admin/schemas/settings";

type P = { id: string };

export const PATCH = route<P>("admin.staff", async ({ req, params }) => {
  const actor = await guard("staff.manage");
  return ok(await updateStaff(actor, params.id, await parse(req, StaffPatchSchema)));
});

export const DELETE = route<P>("admin.staff", async ({ params }) => {
  const actor = await guard("staff.manage");
  return ok(await removeStaff(actor, params.id));
});
