"use client";

import { usePathname, useRouter } from "next/navigation";
import { BarList, Funnel } from "@/components/admin/Bars";
import { ChartCard } from "@/components/admin/ChartCard";
import { Select } from "@/components/admin/Fields";
import { PageHeader } from "@/components/admin/Panel";
import { StatCard } from "@/components/admin/StatCard";
import { TrendChart } from "@/components/admin/TrendChart";
import { formatPrice } from "@/lib/format";
import type { AdminAnalytics, Kpi } from "@/types/admin";

const RANGES = [{ value: 7, label: "Last 7 days" }, { value: 30, label: "Last 30 days" }, { value: 90, label: "Last 90 days" }];
const titleCase = (s: string) => s.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

export function AnalyticsView({ data, days }: { data: AdminAnalytics; days: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const { totals } = data;
  const period = RANGES.find((r) => r.value === days)?.label.toLowerCase() ?? `last ${days} days`;
  const kpis: Kpi[] = [
    { id: "rev", label: "Revenue", value: totals.revenue, format: "money" },
    { id: "ord", label: "Orders", value: totals.orders, format: "number" },
    { id: "aov", label: "Avg. order value", value: totals.aov, format: "money" },
    { id: "conv", label: "Conversion", value: totals.sessions ? (totals.orders / totals.sessions) * 100 : 0, format: "percent" },
    { id: "ref", label: "Refunded", value: totals.refunded, format: "money" },
  ];

  return (
    <>
      <PageHeader title="Analytics" description="Commerce performance from order, payment and storefront event data."
        actions={<Select label="Date range" value={String(days)} onChange={(e) => router.push(`${pathname}?days=${e.target.value}`)} wrapperClassName="min-w-44">
          {RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </Select>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{kpis.map((k) => <StatCard key={k.id} kpi={k} hint={period} />)}</div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartCard title="Revenue" description="Daily, incl. GST" table={{ headers: ["Date", "Revenue"], rows: data.series.map((p) => [p.date, formatPrice(p.revenue)]) }}>
          <TrendChart data={data.series} series={[{ key: "revenue", label: "Revenue", color: "var(--ink)" }]} format="money" />
        </ChartCard>
        <ChartCard title="Orders" description="Daily" table={{ headers: ["Date", "Orders"], rows: data.series.map((p) => [p.date, p.orders]) }}>
          <TrendChart data={data.series} series={[{ key: "orders", label: "Orders", color: "var(--accent-deep)" }]} />
        </ChartCard>
        <ChartCard title="Top products" description={`By revenue, ${period}`}>
          <BarList items={data.topProducts.map((p) => ({ label: p.name, value: p.revenue, display: `${formatPrice(p.revenue)} · ${p.quantity} sold` }))} />
        </ChartCard>
        <ChartCard title="Payments by provider" description="Captured amount">
          <BarList items={data.byProvider.map((p) => ({ label: titleCase(p.provider), value: p.captured, display: `${formatPrice(p.captured)} · ${p.payments} paid, ${p.failedAttempts} failed` }))} />
        </ChartCard>
        <ChartCard title="Orders by status">
          <BarList items={Object.entries(data.byStatus).map(([s, n]) => ({ label: titleCase(s), value: n, display: String(n) }))} />
        </ChartCard>
        <ChartCard title="Conversion funnel" description={`Storefront events, ${period}`}>
          <Funnel steps={data.funnel.map((f) => ({ step: titleCase(f.step), count: f.count }))} />
        </ChartCard>
      </div>
    </>
  );
}
