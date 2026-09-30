import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { getCurrentStaff } from "@/backend/admin/repo";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

// TODO(backend agent): RBAC is also enforced in src/proxy.ts + every /api/admin route; this UI guard is cosmetic.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const me = await getCurrentStaff();
  return <AdminShell me={me}>{children}</AdminShell>;
}
