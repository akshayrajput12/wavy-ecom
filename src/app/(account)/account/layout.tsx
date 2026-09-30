import { redirect } from "next/navigation";
import { getAccountUser } from "@/backend/orders/repo";
import { AccountNav } from "@/views/account/components/AccountNav";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  // ponytail: layout guard for UX; data access is still RLS-scoped per user (proxy.ts refreshes session)
  if (!(await getAccountUser())) redirect("/login?next=/account");
  return (
    <div className="grid gap-6 py-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 lg:py-12">
      <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start"><AccountNav /></aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
