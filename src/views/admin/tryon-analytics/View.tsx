import { Clock, ShieldCheck } from "lucide-react";
import { Funnel } from "@/components/admin/Bars";
import { ChartCard } from "@/components/admin/ChartCard";
import { PageHeader, Panel } from "@/components/admin/Panel";
import { StatCard } from "@/components/admin/StatCard";
import { TrendChart } from "@/components/admin/TrendChart";
import { formatNumber } from "@/components/admin/format";
import type { TryOnMetrics } from "@/data/admin/types";
import { formatPrice } from "@/lib/format";

export function TryOnAnalyticsView({ metrics: m }: { metrics: TryOnMetrics }) {
  const totalCost = m.providers.reduce((s, p) => s + p.costPaise, 0);
  const totalGen = m.providers.reduce((s, p) => s + p.generations, 0);
  return (
    <>
      <PageHeader title="Try-on analytics" description="Virtual try-on usage, impact on conversion, provider cost and asset retention." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{m.kpis.map((k) => <StatCard key={k.id} kpi={k} />)}</div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartCard title="Generations per day" description="Started vs completed, last 14 days"
          table={{ headers: ["Date", "Started", "Completed"], rows: m.daily.map((d) => [d.date, d.generations, d.completed]) }}>
          <TrendChart data={m.daily} series={[{ key: "generations", label: "Started", color: "var(--ink)" }, { key: "completed", label: "Completed", color: "var(--accent-deep)" }]} />
        </ChartCard>
        <ChartCard title="Try-on funnel" description="Opened → purchased, last 30 days"><Funnel steps={m.funnel} /></ChartCard>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
        <Panel title="Providers" description={`${formatNumber(totalGen)} generations · ${formatPrice(totalCost)} total · ${formatPrice(Math.round(totalCost / Math.max(totalGen, 1)))} avg per render`}>
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[560px] text-body">
              <caption className="sr-only">Try-on provider usage and cost</caption>
              <thead className="text-left text-meta text-ink-soft">
                <tr>{["Provider", "Generations", "Cost (30d)", "Avg latency", "Failure rate"].map((h) => <th key={h} scope="col" className="px-5 py-2 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {m.providers.map((p) => (
                  <tr key={p.name} className="border-t border-line-soft tabular-nums">
                    <th scope="row" className="px-5 py-2.5 text-left font-medium">{p.name}</th>
                    <td className="px-5">{formatNumber(p.generations)}</td>
                    <td className="px-5">{formatPrice(p.costPaise)}</td>
                    <td className="px-5">{p.avgSeconds}s</td>
                    <td className="px-5">{p.failureRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Asset retention">
          <ul className="flex flex-col gap-4 text-body">
            <li className="flex gap-3"><Clock className="mt-0.5 size-4 shrink-0 text-ink-soft" aria-hidden /><span><span className="font-medium">TTL {m.assetTtlHours} hours</span><span className="t-meta block">Customer photos and renders auto-expire, then are deleted from private storage.</span></span></li>
            <li className="flex gap-3"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-ink-soft" aria-hidden /><span><span className="font-medium">{formatNumber(m.purgedLast24h)} assets purged</span><span className="t-meta block">In the last 24 hours by the retention job.</span></span></li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
