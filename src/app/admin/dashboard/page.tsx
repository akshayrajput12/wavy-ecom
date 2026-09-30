import { getDashboard } from "@/backend/admin/repo";
import { DashboardView } from "@/views/admin/dashboard/View";

export const metadata = { title: "Dashboard" };

export default async function Page() {
  return <DashboardView data={await getDashboard()} />;
}
