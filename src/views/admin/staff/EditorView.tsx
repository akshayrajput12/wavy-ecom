"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/admin/Fields";
import { PageHeader, Panel } from "@/components/admin/Panel";
import { STAFF_ROLES, StaffInviteSchema, StaffPatchSchema } from "@/backend/admin/schemas/settings";
import type { AdminStaff } from "@/types/admin";
import { BackLink, DeleteButton, EditorForm } from "../_kit/Chrome";
import { useEditor } from "../_kit/useEditor";
import { ROLE_LABELS } from "../rbac";

export function StaffEditorView({ member }: { member: AdminStaff | null }) {
  const { v, set, errors, busy, save, remove } = useEditor({
    email: member?.email ?? "", fullName: member?.fullName ?? "", role: (member?.role ?? "support_agent") as (typeof STAFF_ROLES)[number],
    status: (member?.status === "suspended" ? "suspended" : "active") as "active" | "suspended", suspendedReason: member?.suspendedReason ?? "",
  }, { schema: member ? StaffPatchSchema : StaffInviteSchema, back: "/admin/staff" });
  const name = v.fullName.trim() || null;
  const submit = () => member
    ? save("PATCH", `staff/${member.id}`, { role: v.role, status: v.status, fullName: name, suspendedReason: v.status === "suspended" ? v.suspendedReason.trim() || null : null }, "Staff updated")
    : save("POST", "staff", { email: v.email, fullName: name, role: v.role }, "Invite sent");
  return (
    <>
      <BackLink href="/admin/staff">All staff</BackLink>
      <PageHeader title={member ? "Edit staff member" : "Invite staff"} description={member ? undefined : "They get an email invite. Re-inviting an address re-sends a pending invite."} />
      <EditorForm onSave={submit} busy={busy} back="/admin/staff"
        danger={member && <DeleteButton label="Remove access" busy={busy} onConfirm={() => void remove(`staff/${member.id}`, "Access removed")} />}>
        <Panel>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Email" type="email" value={v.email} disabled={!!member} error={errors.email} onChange={(e) => set("email", e.target.value)} />
            <Input label="Full name" value={v.fullName} error={errors.fullName} onChange={(e) => set("fullName", e.target.value)} />
            <Select label="Role" value={v.role} error={errors.role} hint={member ? "You cannot change your own role or status." : undefined} onChange={(e) => set("role", e.target.value as typeof v.role)}>
              {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </Select>
            {member && (
              <Select label="Status" value={v.status} onChange={(e) => set("status", e.target.value as typeof v.status)}>
                <option value="active">Active</option><option value="suspended">Suspended</option>
              </Select>
            )}
            {member && v.status === "suspended" && <Input label="Suspension reason" className="sm:col-span-2" value={v.suspendedReason} error={errors.suspendedReason} onChange={(e) => set("suspendedReason", e.target.value)} />}
          </div>
        </Panel>
      </EditorForm>
    </>
  );
}
