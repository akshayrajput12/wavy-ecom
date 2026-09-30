import { clsx } from "clsx";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { Kpi } from "@/types/admin";
import { formatKpi } from "./format";

/** KPI tile. Delta (vs `previous`, when given) shows sign + arrow + text, never colour alone. */
export function StatCard({ kpi, hint }: { kpi: Kpi; hint?: string }) {
  const delta = kpi.previous ? Math.round(((kpi.value - kpi.previous) / kpi.previous) * 1000) / 10 : null;
  const up = (delta ?? 0) >= 0;
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="rounded-md border border-line bg-surface p-5">
      <p className="t-overline text-ink-soft">{kpi.label}</p>
      <p className="mt-2 text-h2 font-semibold tracking-tight tabular-nums">{formatKpi(kpi)}</p>
      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-meta">
        {delta !== null && (
          <span className={clsx("inline-flex items-center gap-0.5 font-medium", up ? "text-success" : "text-danger")}>
            <Arrow className="size-3.5" aria-hidden />{up ? "+" : ""}{delta}%
            <span className="sr-only">{up ? "increase" : "decrease"}</span>
          </span>
        )}
        <span className="text-ink-soft">{delta !== null ? "vs previous period" : hint}</span>
      </p>
    </div>
  );
}
