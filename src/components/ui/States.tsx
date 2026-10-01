import { clsx } from "clsx";
import type { ReactNode } from "react";

/** Skeleton block for async lists (SRS §7). */
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-sm bg-line-soft", className)} aria-hidden />;
}

/** Contextual empty / error state with a recovery action. */
export function EmptyState({ title, body, action, icon }: { title: string; body?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 rounded-xl bg-surface-2/60 px-6 py-16 text-center">
      {icon && <div className="grid size-16 place-items-center rounded-pill bg-surface text-ink-soft">{icon}</div>}
      <p className="t-h3">{title}</p>
      {body && <p className="max-w-sm text-body text-ink-soft">{body}</p>}
      {action}
    </div>
  );
}
