import { formatNumber } from "./format";

/** Horizontal labelled bars (category breakdowns, provider usage). Plain HTML: values are direct-labelled. */
export function BarList({ items }: { items: { label: string; value: number; display: string }[] }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="flex flex-col gap-3">
      {items.map((i) => (
        <li key={i.label} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 text-meta">
          <span className="truncate text-ink-soft">{i.label}</span>
          <span className="h-2.5 rounded-pill bg-line-soft"><span className="block h-full rounded-pill bg-ink" style={{ width: `${(i.value / max) * 100}%` }} /></span>
          <span className="tabular-nums font-medium">{i.display}</span>
        </li>
      ))}
    </ul>
  );
}

/** Step funnel with step-to-step and overall conversion. */
export function Funnel({ steps }: { steps: { step: string; count: number }[] }) {
  const top = steps[0]?.count || 1;
  return (
    <ol className="flex flex-col gap-2.5">
      {steps.map((s, i) => {
        const prev = i ? steps[i - 1].count : s.count;
        return (
          <li key={s.step} className="text-meta">
            <div className="mb-1 flex justify-between gap-2">
              <span className="font-medium">{s.step}</span>
              <span className="tabular-nums text-ink-soft">
                {formatNumber(s.count)} · {((s.count / top) * 100).toFixed(1)}%
                {i > 0 && <span className="ml-1">({((s.count / prev) * 100).toFixed(0)}% of previous)</span>}
              </span>
            </div>
            <div className="h-6 rounded-sm bg-line-soft">
              <div className="h-full rounded-sm bg-accent" style={{ width: `${(s.count / top) * 100}%` }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
