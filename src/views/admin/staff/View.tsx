"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/Panel";
import { formatDateTime } from "@/components/admin/format";
import { StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import type { AdminStaff } from "@/types/admin";
import { ROLE_LABELS } from "../rbac";

const cols: Column<AdminStaff>[] = [
  { key: "email", header: "Staff member", sort: (s) => s.email, cell: (s) => (
    <Link href={`/admin/staff/${s.id}/edit`} className="font-medium underline-offset-4 hover:underline">{s.fullName ?? s.email}<span className="block text-meta font-normal text-ink-soft">{s.fullName ? s.email : ""}</span></Link>
  ) },
  { key: "role", header: "Role", sort: (s) => s.role, cell: (s) => ROLE_LABELS[s.role as keyof typeof ROLE_LABELS] ?? s.role },
  { key: "status", header: "Status", cell: (s) => <StatusBadge status={s.status} /> },
  { key: "seen", header: "Last seen", sort: (s) => s.lastSeenAt ?? "", cell: (s) => (s.lastSeenAt ? formatDateTime(s.lastSeenAt) : s.activatedAt ? "Never" : "Invite pending") },
];

export function StaffView({ staff }: { staff: AdminStaff[] }) {
  return (
    <>
      <PageHeader title="Staff" description="Invite people and choose what they can do." actions={<ButtonLink href="/admin/staff/new">Invite staff</ButtonLink>} />
      <DataTable caption="Staff members" rows={staff} columns={cols} getId={(s) => s.id} search={(s) => `${s.email} ${s.fullName ?? ""}`} searchPlaceholder="Search staff"
        empty={{ title: "No staff yet" }} />
    </>
  );
}
