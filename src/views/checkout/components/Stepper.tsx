import { clsx } from "clsx";
import { Check } from "lucide-react";

type Step = { id: string; label: string };

/** Numbered progress stepper. Completed steps are buttons so customers can jump back. */
export function Stepper({ steps, current, onSelect }: { steps: readonly Step[]; current: number; onSelect?: (i: number) => void }) {
  return (
    <nav aria-label="Checkout progress">
      <ol className="flex items-center gap-1 overflow-x-auto sm:gap-2">
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          const body = (
            <>
              <span
                className={clsx(
                  "grid size-6 shrink-0 place-items-center rounded-full text-micro font-semibold",
                  done ? "bg-ink text-on-dark" : active ? "bg-accent text-ink" : "border border-line text-ink-muted",
                )}
                aria-hidden
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className={clsx("text-meta whitespace-nowrap", active ? "font-semibold text-ink" : "text-ink-soft")}>
                {s.label}
              </span>
            </>
          );
          return (
            <li key={s.id} className="flex items-center gap-1 sm:gap-2" aria-current={active ? "step" : undefined}>
              {done && onSelect ? (
                <button type="button" onClick={() => onSelect(i)} className="flex min-h-11 items-center gap-2 rounded-sm px-1 hover:bg-surface-warm">
                  {body}
                  <span className="sr-only">(completed, edit)</span>
                </button>
              ) : (
                <span className="flex min-h-11 items-center gap-2 px-1">{body}</span>
              )}
              {i < steps.length - 1 && <span className="h-px w-4 bg-line sm:w-8" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
