import { getAnalytics, getDashboard } from "@/backend/admin/repo";
import { DashboardView } from "@/views/admin/dashboard/View";

export const metadata = { title: "Dashboard" };

export default async function Page() {
  const to = new Date();
  // Trend needs analytics.read; roles without it just don't see the chart.
  const [data, trend] = await Promise.all([
    getDashboard(),
    getAnalytics({ from: new Date(to.getTime() - 30 * 86_400_000).toISOString(), to: to.toISOString() }).then((a) => a.series, () => null),
  ]);
  return <DashboardView data={data} trend={trend} />;
}
