"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Select } from "@/components/admin/Fields";
import { PageHeader, Panel } from "@/components/admin/Panel";
import { formatDateTime } from "@/components/admin/format";
import type { StaffMember, StaffRole } from "@/data/admin/types";
import { mutate } from "../api";
import { ROLE_LABELS } from "../rbac";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function StaffView({ staff, meId }: { staff: StaffMember[]; meId: string }) {
  const [rows, setRows] = useState(staff);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("catalog_manager");
  const error = email && !EMAIL.test(email) ? "Enter a valid email" : rows.some((r) => r.email === email.toLowerCase()) ? "Already on the team" : undefined;

  const invite = () => {
    if (!email || error) return;
    const m: StaffMember = { id: crypto.randomUUID(), name: email.split("@")[0], email: email.toLowerCase(), role, status: "invited" };
    const before = rows;
    setRows([m, ...rows]); setEmail("");
    // TODO(backend agent): call /api/admin/staff/invite (Supabase invite + Resend email; audit-logged)
    void mutate("staff/invite", { email: m.email, role }, { success: `Invite sent to ${m.email}`, rollback: () => setRows(before) });
  };
  const setStatus = (m: StaffMember, status: StaffMember["status"]) => {
    const before = rows;
    setRows(rows.map((r) => (r.id === m.id ? { ...r, status } : r)));
    void mutate(`staff/${m.id}/status`, { status }, { success: `${m.name} ${status === "suspended" ? "suspended" : "reactivated"}`, rollback: () => setRows(before) });
  };

  const columns: Column<StaffMember>[] = [
    { key: "name", header: "Member", sort: (m) => m.name, cell: (m) => <><span className="block font-medium">{m.name}{m.id === meId && " (you)"}</span><span className="t-meta">{m.email}</span></> },
    { key: "role", header: "Role", sort: (m) => m.role, cell: (m) => ROLE_LABELS[m.role] },
    { key: "status", header: "Status", sort: (m) => m.status, cell: (m) => <StatusBadge status={m.status === "invited" ? "pending" : m.status === "suspended" ? "disabled" : "active"} /> },
    { key: "last", header: "Last active", sort: (m) => m.lastActiveAt ?? "", cell: (m) => (m.lastActiveAt ? formatDateTime(m.lastActiveAt) : "—") },
    { key: "act", header: "Actions", cell: (m) => m.id !== meId && (
      m.status === "suspended" ? <Button size="sm" variant="secondary" onClick={() => setStatus(m, "active")}>Reactivate</Button>
        : m.status === "invited" ? <Button size="sm" variant="ghost" onClick={() => void mutate(`staff/${m.id}/resend`, {}, { success: `Invite re-sent to ${m.email}` })}>Resend invite</Button>
        : <Button size="sm" variant="ghost" className="text-danger" onClick={() => setStatus(m, "suspended")}>Suspend</Button>
    ) },
  ];

  return (
    <>
      <PageHeader title="Staff" description="Who can access the admin console and what their role allows." />
      <Panel title="Invite staff" className="mb-6">
        <form className="grid items-start gap-3 sm:grid-cols-[1fr_240px_auto]" onSubmit={(e) => { e.preventDefault(); invite(); }}>
          <Input label="Work email" type="email" value={email} onChange={(e) => setEmail(e.target.value.trim())} error={error} />
          <Select label="Role" value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
            {(Object.keys(ROLE_LABELS) as StaffRole[]).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </Select>
          <Button type="submit" size="sm" className="sm:mt-7" disabled={!email || !!error}>Send invite</Button>
        </form>
      </Panel>
      <DataTable caption="Staff members" rows={rows} columns={columns} getId={(m) => m.id} search={(m) => `${m.name} ${m.email}`} searchPlaceholder="Search staff"
        filters={[{ key: "role", label: "Role", options: (Object.keys(ROLE_LABELS) as StaffRole[]).map((r) => ({ value: r, label: ROLE_LABELS[r] })), match: (m, v) => m.role === v }]} />
    </>
  );
}
