import { ButtonLink } from "@/components/ui/Button";
import { ChartCard } from "@/components/admin/ChartCard";
import { PageHeader } from "@/components/admin/Panel";
import { StatCard } from "@/components/admin/StatCard";
import { TrendChart } from "@/components/admin/TrendChart";
import type { getDashboard } from "@/backend/admin/repo";
import { formatPrice } from "@/lib/format";
import { Alerts } from "./components/Alerts";
import { LowStock } from "./components/LowStock";
import { RecentOrders } from "./components/RecentOrders";

export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;

export function DashboardView({ data }: { data: DashboardData }) {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Today's commerce health: sales, orders, stock and anything that needs attention."
        actions={data.shortcuts.map((s, i) => (
          <ButtonLink key={s.href} href={s.href} size="sm" variant={i === 0 ? "primary" : "secondary"}>{s.label}</ButtonLink>
        ))}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((k) => <StatCard key={k.id} kpi={k} />)}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartCard
            title="Revenue, last 30 days" description="Daily captured revenue incl. GST"
            table={{ headers: ["Date", "Revenue", "Orders"], rows: data.series.map((p) => [p.date, formatPrice(p.revenue), p.orders]) }}
          >
            <TrendChart data={data.series} series={[{ key: "revenue", label: "Revenue", color: "var(--ink)" }]} format="money" />
          </ChartCard>
        </div>
        <Alerts alerts={data.alerts} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2"><RecentOrders orders={data.recentOrders} /></div>
        <LowStock items={data.lowStock} />
      </div>
    </>
  );
}
