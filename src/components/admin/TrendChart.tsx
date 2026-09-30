"use client";

import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPrice } from "@/lib/format";

type Format = "money" | "number";
const fmt = (f: Format, v: number) => (f === "money" ? formatPrice(v) : new Intl.NumberFormat("en-IN").format(v));
const compact = (f: Format, v: number) =>
  (f === "money" ? "₹" : "") + new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(f === "money" ? v / 100 : v);
const day = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/** Time series: first series is an area, the rest lines. One y-axis only; colours are CSS vars. */
export function TrendChart<T extends { date: string }>({ data, series, format = "number", height = 260 }: {
  data: T[]; series: { key: keyof T & string; label: string; color: string }[]; format?: Format; height?: number;
}) {
  const [first, ...rest] = series;
  return (
    <div style={{ height }} className="text-meta">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--line-soft)" vertical={false} />
          <XAxis dataKey="date" tickFormatter={day} tick={{ fill: "var(--ink-soft)", fontSize: 11 }} axisLine={{ stroke: "var(--line)" }} tickLine={false} minTickGap={24} />
          <YAxis tickFormatter={(v: number) => compact(format, v)} tick={{ fill: "var(--ink-soft)", fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
          <Tooltip
            cursor={{ stroke: "var(--ink-muted)", strokeDasharray: "3 3" }}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12, color: "var(--ink)" }}
            labelFormatter={(l) => day(String(l))}
            formatter={(v) => fmt(format, Number(v))}
          />
          {series.length > 1 && <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, color: "var(--ink-soft)" }} />}
          <Area type="monotone" dataKey={String(first.key)} name={first.label} stroke={first.color} strokeWidth={2} fill={first.color} fillOpacity={0.08} activeDot={{ r: 4 }} />
          {rest.map((s) => <Line key={s.key} type="monotone" dataKey={String(s.key)} name={s.label} stroke={s.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />)}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
