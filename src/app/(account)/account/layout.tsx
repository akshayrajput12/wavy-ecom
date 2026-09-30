import { redirect } from "next/navigation";
import { getSession } from "@/backend/_core/auth";
import { isStaffRole } from "@/backend/_core/permissions";
import { AccountNav } from "@/views/account/components/AccountNav";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  // ponytail: layout guard is UX only; every read is RLS-scoped to the user (proxy.ts refreshes the session)
  const session = await getSession();
  if (!session) redirect("/login?next=/account");
  return (
    <div className="grid gap-6 py-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 lg:py-12">
      <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start"><AccountNav isStaff={isStaffRole(session.role)} /></aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
