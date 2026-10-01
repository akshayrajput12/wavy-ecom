import { formatNumber } from "./format";

/** Horizontal labelled bars (category breakdowns, provider usage). Plain HTML: values are direct-labelled. */
export function BarList({ items }: { items: { label: string; value: number; display: string }[] }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="flex flex-col gap-3">
      {items.map((i) => (
        <li key={i.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-meta sm:grid-cols-[110px_minmax(0,1fr)_auto]">
          <span className="truncate text-ink-soft">{i.label}</span>
          <span className="col-span-2 row-start-2 h-2.5 rounded-pill bg-line-soft sm:col-span-1 sm:row-start-auto"><span className="block h-full rounded-pill bg-accent-deep" style={{ width: `${(i.value / max) * 100}%` }} /></span>
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
            <div className="mb-1 flex flex-wrap justify-between gap-x-2">
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
