import { getAnalytics } from "@/backend/admin/repo";
import { AnalyticsView } from "@/views/admin/analytics/View";

export const metadata = { title: "Analytics" };

export default async function Page({ searchParams }: PageProps<"/admin/analytics">) {
  const raw = Number((await searchParams).days);
  const days = [7, 30, 90].includes(raw) ? raw : 30;
  const to = new Date();
  const from = new Date(to.getTime() - days * 86_400_000);
  return <AnalyticsView days={days} data={await getAnalytics({ from: from.toISOString(), to: to.toISOString() })} />;
}
