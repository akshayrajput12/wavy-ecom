import { clsx } from "clsx";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { Kpi } from "@/data/admin/types";
import { formatKpi } from "./format";

/** KPI tile. Delta shows sign + arrow + text, never colour alone. */
export function StatCard({ kpi }: { kpi: Kpi }) {
  const up = kpi.delta >= 0;
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="rounded-md border border-line bg-surface p-5">
      <p className="t-overline text-ink-soft">{kpi.label}</p>
      <p className="mt-2 text-h2 font-semibold tracking-tight tabular-nums">{formatKpi(kpi)}</p>
      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-meta">
        <span className={clsx("inline-flex items-center gap-0.5 font-medium", up ? "text-success" : "text-danger")}>
          <Arrow className="size-3.5" aria-hidden />{up ? "+" : ""}{kpi.delta}%
          <span className="sr-only">{up ? "increase" : "decrease"}</span>
        </span>
        <span className="text-ink-soft">{kpi.hint}</span>
      </p>
    </div>
  );
}
