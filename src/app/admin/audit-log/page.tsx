import { listAuditLog } from "@/backend/admin/repo";
import { AuditQuery } from "@/backend/admin/schemas/settings";
import { AuditLogView } from "@/views/admin/audit-log/View";

export const metadata = { title: "Audit log" };

const iso = (d: string | undefined, end: boolean) => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T${end ? "23:59:59.999" : "00:00:00"}+05:30` : undefined);

export default async function Page({ searchParams }: PageProps<"/admin/audit-log">) {
  const sp = await searchParams;
  const s = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string) : undefined);
  const parsed = AuditQuery.safeParse({
    entityType: s("entityType"), entityId: s("entityId"), action: s("action"), from: iso(s("from"), false), to: iso(s("to"), true), page: s("page"),
  });
  const q = parsed.success ? parsed.data : AuditQuery.parse({});
  return (
    <AuditLogView data={await listAuditLog(q)} filters={{ entityType: q.entityType, entityId: q.entityId, action: q.action, from: s("from"), to: s("to") }} />
  );
}
