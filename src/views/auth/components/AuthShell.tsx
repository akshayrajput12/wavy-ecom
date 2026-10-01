import type { ReactNode } from "react";
import { authCopy } from "@/data/copy";

// ponytail: pill fields via a descendant variant so the shared <Input> stays untouched (checkboxes excluded).
const PILL_FIELDS = "[&_input:not([type=checkbox])]:h-12 [&_input:not([type=checkbox])]:rounded-pill [&_input:not([type=checkbox])]:px-5";

/** Auth layout: form column + dark brand panel on desktop (panel hidden below lg). */
export function AuthShell({ overline, title, body, children, footer }: {
  overline?: string; title: string; body: string; children: ReactNode; footer?: ReactNode;
}) {
  const p = authCopy.panel;
  return (
    <div className="grid gap-10 py-10 sm:py-16 lg:min-h-[calc(100svh-var(--header-h))] lg:grid-cols-2 lg:gap-16 lg:py-6">
      <div className="mx-auto grid w-full max-w-md content-center gap-8">
        <header className="grid gap-3">
          {overline && <p className="t-overline">{overline}</p>}
          <h1 className="t-display">{title}</h1>
          <p className="text-body text-ink-soft">{body}</p>
        </header>
        <div className={PILL_FIELDS}>{children}</div>
        {footer && <p className="border-t border-line pt-6 text-body text-ink-soft">{footer}</p>}
      </div>

      <aside aria-label={p.label} className="on-dark hidden flex-col justify-between gap-12 rounded-xl p-12 lg:flex">
        <p className="t-overline">{p.overline}</p>
        <div className="grid gap-8">
          <h2 className="t-display">{p.heading[0]}<br /><span className="text-ink-soft">{p.heading[1]}</span></h2>
          <p className="max-w-sm text-body text-ink-soft">{p.body}</p>
          <ol className="grid border-t border-line">
            {p.perks.map((perk, i) => (
              <li key={perk} className="flex items-baseline gap-4 border-b border-line py-4 text-body">
                <span className="t-index text-ink-soft">{String(i + 1).padStart(2, "0")}</span>{perk}
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  );
}

/** Form-level result message (field errors stay on their fields). Status is text, never colour alone. */
export function FormAlert({ error, message }: { error?: string; message?: string }) {
  if (!error && !message) return null;
  return (
    <p role={error ? "alert" : "status"} className={`rounded-md border px-4 py-3 text-body ${error ? "border-danger/30 bg-danger/10 text-danger" : "border-success/30 bg-success/10 text-success"}`}>
      {error ? `⚠ ${error}` : `✓ ${message}`}
    </p>
  );
}
