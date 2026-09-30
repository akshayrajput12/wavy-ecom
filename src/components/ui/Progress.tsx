import { clsx } from "clsx";
import { Check } from "lucide-react";

/** Linear progress bar. `value` is 0–1; the fill glides on change (transform only). */
export function Progress({ value, label, showValue, className }: { value: number; label: string; showValue?: boolean; className?: string }) {
  const v = Math.min(1, Math.max(0, value));
  return (
    <div className={className}>
      {showValue && (
        <div className="mb-1.5 flex justify-between text-meta text-ink-soft">
          <span>{label}</span>
          <span className="tabular-nums">{Math.round(v * 100)}%</span>
        </div>
      )}
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)} className="h-1.5 overflow-hidden rounded-pill bg-line-soft">
        <div className="h-full origin-left rounded-pill bg-accent-deep transition-transform duration-(--dur-slow) ease-out" style={{ transform: `scaleX(${v})` }} />
      </div>
    </div>
  );
}

/**
 * Checkout-style stepper: animated track fill + step dots (done = check, current = ring).
 * `current` is the 0-based active step. Labels hide below `sm` except the current one.
 */
export function Stepper({ steps, current, label = "Progress", className }: { steps: string[]; current: number; label?: string; className?: string }) {
  const fill = steps.length > 1 ? Math.min(1, Math.max(0, current / (steps.length - 1))) : 1;
  return (
    <nav aria-label={label} className={className}>
      <ol className="relative flex justify-between">
        <span className="absolute inset-x-4 top-4 h-0.5 -translate-y-1/2 rounded-pill bg-line" aria-hidden>
          <span className="block h-full origin-left rounded-pill bg-accent-deep transition-transform duration-(--dur-slow) ease-out" style={{ transform: `scaleX(${fill})` }} />
        </span>
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={s} aria-current={active ? "step" : undefined} className="relative flex flex-col items-center gap-2">
              <span
                className={clsx(
                  "grid size-8 place-items-center rounded-pill border-2 text-micro font-semibold transition-colors duration-(--dur-base)",
                  done && "border-accent-deep bg-accent-deep text-on-dark",
                  active && "border-accent-deep bg-surface text-accent-deep",
                  !done && !active && "border-line bg-surface text-ink-muted",
                )}
              >
                {done ? <Check className="size-4" aria-hidden /> : i + 1}
              </span>
              <span className={clsx("text-meta", active ? "font-medium text-ink" : "hidden text-ink-soft sm:block")}>
                {s}
                {done && <span className="sr-only"> (completed)</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
