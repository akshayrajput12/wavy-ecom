import { clsx } from "clsx";
import type { ReactNode } from "react";

/** Admin page title row. */
export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-0 basis-full sm:basis-auto sm:flex-1">
        <h1 className="t-h1 break-words">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-body text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Card surface used across admin screens. */
export function Panel({ title, description, actions, children, className }: {
  title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={clsx("min-w-0 rounded-lg border border-line bg-surface p-4 sm:p-5", className)} aria-label={title}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="text-body-lg font-semibold">{title}</h2>}
            {description && <p className="t-meta mt-0.5">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

/** Settings/editor form block: heading on the left, fields in a responsive grid. */
export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-b border-line py-6 first:pt-0 last:border-0 md:grid-cols-[220px_minmax(0,1fr)] md:gap-8">
      <div>
        <h2 className="text-body-lg font-semibold">{title}</h2>
        {description && <p className="t-meta mt-1">{description}</p>}
      </div>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

/** Key/value list for detail screens. */
export function DefinitionList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-3 text-body">
      {items.map((i) => (
        <div key={i.label} className="grid gap-x-3 gap-y-0.5 sm:grid-cols-[120px_minmax(0,1fr)]">
          <dt className="text-ink-soft">{i.label}</dt>
          <dd className="min-w-0 break-words">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}
