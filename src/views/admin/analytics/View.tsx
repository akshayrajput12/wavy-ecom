"use client";

import { useState } from "react";
import { BarList, Funnel } from "@/components/admin/Bars";
import { ChartCard } from "@/components/admin/ChartCard";
import { Select } from "@/components/admin/Fields";
import { PageHeader } from "@/components/admin/Panel";
import { StatCard } from "@/components/admin/StatCard";
import { TrendChart } from "@/components/admin/TrendChart";
import type { getAnalytics } from "@/backend/admin/repo";
import type { Kpi } from "@/data/admin/types";
import { formatPrice } from "@/lib/format";

type Data = Awaited<ReturnType<typeof getAnalytics>>;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 1000) / 10 : 0);

export function AnalyticsView({ data }: { data: Data }) {
  const [range, setRange] = useState<string>("30");
  const days = Number(range);
  const cur = data.series.slice(-days);
  // ponytail: "previous period" = the days before the window inside the same 30-day series; longer history comes from the backend.
  const prev = data.series.slice(-days * 2, -days);
  const agg = (s: typeof cur) => {
    const revenue = sum(s.map((p) => p.revenue)), orders = sum(s.map((p) => p.orders)), sessions = sum(s.map((p) => p.sessions));
    return { revenue, orders, aov: orders ? Math.round(revenue / orders) : 0, conv: sessions ? (orders / sessions) * 100 : 0 };
  };
  const a = agg(cur), b = agg(prev);
  const hint = prev.length ? "vs previous period" : "no prior period in range";
  const kpis: Kpi[] = [
    { id: "rev", label: "Revenue", value: a.revenue, format: "money", delta: pct(a.revenue, b.revenue), hint },
    { id: "ord", label: "Orders", value: a.orders, format: "number", delta: pct(a.orders, b.orders), hint },
    { id: "aov", label: "Avg. order value", value: a.aov, format: "money", delta: pct(a.aov, b.aov), hint },
    { id: "conv", label: "Conversion", value: a.conv, format: "percent", delta: pct(a.conv, b.conv), hint },
  ];
  const aovSeries = cur.map((p) => ({ date: p.date, aov: p.orders ? Math.round(p.revenue / p.orders) : 0 }));

  return (
    <>
      <PageHeader title="Analytics" description="Commerce performance from GA4 + order data."
        actions={<Select label="Date range" value={range} onChange={(e) => setRange(e.target.value)} wrapperClassName="min-w-44">
          {data.ranges.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </Select>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{kpis.map((k) => <StatCard key={k.id} kpi={k} />)}</div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartCard title="Revenue" description="Daily, incl. GST" table={{ headers: ["Date", "Revenue"], rows: cur.map((p) => [p.date, formatPrice(p.revenue)]) }}>
          <TrendChart data={cur} series={[{ key: "revenue", label: "Revenue", color: "var(--ink)" }]} format="money" />
        </ChartCard>
        <ChartCard title="Orders & sessions" description="Different scales, so shown as separate charts" table={{ headers: ["Date", "Orders", "Sessions"], rows: cur.map((p) => [p.date, p.orders, p.sessions]) }}>
          <TrendChart data={cur} series={[{ key: "orders", label: "Orders", color: "var(--accent-deep)" }]} height={120} />
          <TrendChart data={cur} series={[{ key: "sessions", label: "Sessions", color: "var(--info)" }]} height={120} />
        </ChartCard>
        <ChartCard title="Average order value" table={{ headers: ["Date", "AOV"], rows: aovSeries.map((p) => [p.date, formatPrice(p.aov)]) }}>
          <TrendChart data={aovSeries} series={[{ key: "aov", label: "AOV", color: "var(--ink)" }]} format="money" height={200} />
        </ChartCard>
        <ChartCard title="Revenue by category" description="Last 30 days">
          <BarList items={data.categories.map((c) => ({ label: c.name, value: c.revenue, display: formatPrice(c.revenue) }))} />
        </ChartCard>
      </div>
      <div className="mt-6">
        <ChartCard title="Conversion funnel" description="Sessions → orders, last 30 days"><Funnel steps={data.funnel} /></ChartCard>
      </div>
    </>
  );
}
