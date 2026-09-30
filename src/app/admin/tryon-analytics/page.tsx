import { getTryOnMetrics } from "@/backend/admin/repo";
import { TryOnAnalyticsView } from "@/views/admin/tryon-analytics/View";

export const metadata = { title: "Try-on analytics" };

export default async function Page() {
  return <TryOnAnalyticsView metrics={await getTryOnMetrics()} />;
}
