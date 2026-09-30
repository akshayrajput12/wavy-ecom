import { clsx } from "clsx";
import { useId, type ComponentProps } from "react";

type Props = ComponentProps<"input"> & { label: string; hint?: string; error?: string };

/** Labelled input with helper + field-level error (NFR-003). Works with react-hook-form `register()`. */
export function Input({ label, hint, error, className, id, ...rest }: Props) {
  const auto = useId();
  const inputId = id ?? auto;
  const msgId = `${inputId}-msg`;
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="text-meta font-medium text-ink">{label}</label>
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={hint || error ? msgId : undefined}
        className={clsx(
          "h-11 rounded-sm border bg-surface px-3 text-body text-ink placeholder:text-ink-muted",
          "focus:border-ink focus:outline-none disabled:bg-surface-warm disabled:text-ink-muted",
          error ? "border-danger" : "border-line",
        )}
        {...rest}
      />
      {(error || hint) && (
        <p id={msgId} className={clsx("text-meta", error ? "text-danger" : "text-ink-soft")}>
          {error ? `⚠ ${error}` : hint}
        </p>
      )}
    </div>
  );
}
