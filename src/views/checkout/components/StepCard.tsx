"use client";

import { clsx } from "clsx";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { co } from "../copy";

/** One checkout step: open form when current, collapsed summary + Edit when done, muted when upcoming. */
export function StepCard({ index, label, state, summary, onEdit, children }: {
  index: number; label: string; state: "done" | "current" | "todo"; summary?: ReactNode; onEdit?: () => void; children: ReactNode;
}) {
  const headingId = `step-${index}-h`;
  return (
    <section aria-labelledby={headingId} className={clsx(
      "rounded-xl border bg-surface p-5 transition-shadow duration-(--dur-base) sm:p-7",
      state === "current" ? "border-ink shadow-md" : "border-line",
    )}>
      <div className="flex items-center justify-between gap-4">
        <h2 id={headingId} className={clsx("flex items-center gap-3 t-h3", state === "todo" && "text-ink-muted")}>
          <span aria-hidden className={clsx(
            "t-index grid size-9 place-items-center rounded-pill transition-colors duration-(--dur-base)",
            state === "todo" ? "border border-line" : "bg-ink text-canvas",
          )}>
            {state === "done" ? <Check className="size-4" /> : String(index + 1).padStart(2, "0")}
          </span>
          {label}{state === "done" && <span className="sr-only"> {co.done}</span>}
        </h2>
        {state === "done" && onEdit && (
          <button type="button" onClick={onEdit} className="min-h-11 rounded-pill px-3 text-meta font-medium underline underline-offset-4 hover:bg-surface-warm">
            {co.edit}<span className="sr-only"> {label}</span>
          </button>
        )}
      </div>
      {state === "done" && summary && <div className="mt-3 border-t border-line pl-12 pt-3 text-body text-ink-soft">{summary}</div>}
      {state === "current" && <div className="mt-5 transition-[opacity,translate] duration-(--dur-slow) ease-out starting:translate-y-2 starting:opacity-0">{children}</div>}
    </section>
  );
}
