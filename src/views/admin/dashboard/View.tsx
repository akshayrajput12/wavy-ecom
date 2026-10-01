import { ChartCard } from "@/components/admin/ChartCard";
import { PageHeader } from "@/components/admin/Panel";
import { StatCard } from "@/components/admin/StatCard";
import { TrendChart } from "@/components/admin/TrendChart";
import { ButtonLink } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import type { AdminAnalytics, AdminDashboard } from "@/types/admin";
import { Alerts, buildAlerts } from "./components/Alerts";
import { LowStock } from "./components/LowStock";
import { RecentOrders } from "./components/RecentOrders";

export function DashboardView({ data, trend }: { data: AdminDashboard; trend: AdminAnalytics["series"] | null }) {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Today's commerce health: sales, orders, stock and anything that needs attention."
        actions={<ButtonLink href="/admin/orders" size="sm">Orders</ButtonLink>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((k) => <StatCard key={k.id} kpi={k} />)}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          {trend && (
            <ChartCard
              title="Revenue, last 30 days" description="Daily captured revenue incl. GST"
              table={{ headers: ["Date", "Revenue", "Orders"], rows: trend.map((p) => [p.date, formatPrice(p.revenue), p.orders]) }}
            >
              <TrendChart data={trend} series={[{ key: "revenue", label: "Revenue", color: "var(--ink)" }]} format="money" />
            </ChartCard>
          )}
        </div>
        <Alerts alerts={buildAlerts(data)} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2"><RecentOrders orders={data.recentOrders} /></div>
        <LowStock items={data.lowStock} />
      </div>
    </>
  );
}
