import { getAnalytics } from "@/backend/admin/repo";
import { AnalyticsView } from "@/views/admin/analytics/View";

export const metadata = { title: "Analytics" };

export default async function Page() {
  return <AnalyticsView data={await getAnalytics()} />;
}
