import { clsx } from "clsx";
import type { ReactNode } from "react";

/** Accordion card for one checkout step: form when current, summary + Edit when done, muted when upcoming. */
export function StepCard({ index, label, state, summary, onEdit, children }: {
  index: number; label: string; state: "done" | "current" | "todo";
  summary?: string; onEdit?: () => void; children: ReactNode;
}) {
  const headingId = `step-${index}-h`;
  return (
    <section aria-labelledby={headingId} className={clsx("rounded-md border bg-surface p-5 sm:p-6", state === "current" ? "border-ink" : "border-line")}>
      <div className="flex items-center justify-between gap-4">
        <h2 id={headingId} className={clsx("t-h3", state === "todo" && "text-ink-muted")}>
          <span className="t-meta mr-2">{index + 1}.</span>{label}
        </h2>
        {state === "done" && onEdit && (
          <button type="button" onClick={onEdit} className="min-h-11 px-2 text-meta font-medium underline underline-offset-4">
            Edit<span className="sr-only"> {label}</span>
          </button>
        )}
      </div>
      {state === "done" && summary && <p className="mt-1 text-body text-ink-soft">{summary}</p>}
      {state === "current" && <div className="mt-5">{children}</div>}
    </section>
  );
}
