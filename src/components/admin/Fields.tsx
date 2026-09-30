"use client";

import { clsx } from "clsx";
import { useId, type ComponentProps, type ReactNode } from "react";

const control = "rounded-sm border border-line bg-surface px-3 text-body text-ink focus:border-ink focus:outline-none disabled:bg-surface-warm disabled:text-ink-muted";

function Field({ id, label, hint, error, className, children }: { id: string; label: string; hint?: string; error?: string; className?: string; children: ReactNode }) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-meta font-medium text-ink">{label}</label>
      {children}
      {(hint || error) && <p id={`${id}-msg`} className={clsx("text-meta", error ? "text-danger" : "text-ink-soft")}>{error ? `⚠ ${error}` : hint}</p>}
    </div>
  );
}

type Extra = { label: string; hint?: string; error?: string; wrapperClassName?: string };

export function Select({ label, hint, error, wrapperClassName, className, id, children, ...rest }: Extra & ComponentProps<"select">) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Field id={fid} label={label} hint={hint} error={error} className={wrapperClassName}>
      <select id={fid} aria-invalid={!!error} aria-describedby={hint || error ? `${fid}-msg` : undefined} className={clsx(control, "h-11", className)} {...rest}>{children}</select>
    </Field>
  );
}

export function Textarea({ label, hint, error, wrapperClassName, className, id, ...rest }: Extra & ComponentProps<"textarea">) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Field id={fid} label={label} hint={hint} error={error} className={wrapperClassName}>
      <textarea id={fid} aria-invalid={!!error} aria-describedby={hint || error ? `${fid}-msg` : undefined} className={clsx(control, "min-h-24 py-2", className)} {...rest} />
    </Field>
  );
}

/** Accessible on/off switch. */
export function Toggle({ checked, onChange, label, description, disabled }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <span id={id} className="text-body font-medium">{label}</span>
        {description && <p className="t-meta">{description}</p>}
      </div>
      <button
        type="button" role="switch" aria-checked={checked} aria-labelledby={id} disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-pill transition-colors disabled:opacity-40",
          checked ? "bg-ink" : "bg-line",
        )}
      >
        <span className={clsx("size-5 rounded-full bg-surface shadow-sm transition-transform", checked ? "translate-x-6" : "translate-x-1")} />
        <span className="sr-only">{checked ? "On" : "Off"}</span>
      </button>
    </div>
  );
}
