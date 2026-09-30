import { getAuditLog } from "@/backend/admin/repo";
import { AuditLogView } from "@/views/admin/audit-log/View";

export const metadata = { title: "Audit log" };

export default async function Page() {
  return <AuditLogView entries={await getAuditLog()} />;
}
