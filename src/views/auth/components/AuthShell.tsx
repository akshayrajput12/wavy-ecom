import type { ReactNode } from "react";

export function AuthShell({ title, body, children, footer }: { title: string; body: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-md gap-6 py-12 sm:py-20">
      <header className="grid gap-2 text-center">
        <h1 className="t-display">{title}</h1>
        <p className="text-body text-ink-soft">{body}</p>
      </header>
      <div className="rounded-md border border-line bg-surface p-6">{children}</div>
      {footer && <p className="text-center text-body text-ink-soft">{footer}</p>}
    </div>
  );
}

/** Form-level result message (field errors stay on their fields). */
export function FormAlert({ error, message }: { error?: string; message?: string }) {
  if (!error && !message) return null;
  return (
    <p role={error ? "alert" : "status"} className={`rounded-sm px-3 py-2 text-body ${error ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}>
      {error ? `⚠ ${error}` : message}
    </p>
  );
}
