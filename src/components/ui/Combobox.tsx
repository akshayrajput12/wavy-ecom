"use client";

import { clsx } from "clsx";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useState, type KeyboardEvent, type Ref } from "react";
import { uiCopy } from "@/data/copy";
import { exactOption, filterOptions, moveActive } from "./comboboxFilter";

type Props = {
  label: string;
  options: readonly string[];
  value: string | undefined;
  onChange: (value: string) => void;
  /** Fired when an option is picked from the list (mouse or Enter). */
  onSelect?: (option: string) => void;
  onBlur?: () => void;
  /** Free text: what is typed is the value (city, locality, search). Otherwise only an option can be the value. */
  freeText?: boolean;
  /** false when `options` are already server-filtered results (search). */
  filter?: boolean;
  loading?: boolean;
  name?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  className?: string;
  ref?: Ref<HTMLInputElement>;
};

/**
 * Accessible editable combobox (WAI-ARIA 1.2 list autocomplete): type to filter, ↑/↓ wrap, Home/End jump while an
 * option is active, Enter picks, Escape closes. Styled like `Input`; works with react-hook-form via `Controller`.
 */
export function Combobox({ label, options, value = "", onChange, onSelect, onBlur, freeText, filter = true, loading, name, hint, error, placeholder, autoComplete, disabled, className, ref }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<string | null>(null); // null = not typed since opening: show every option
  const [active, setActive] = useState(-1);
  const list = filter && query !== null ? filterOptions(options, query) : options.slice(0, 60);
  const shown = freeText ? value : query ?? value;
  const msgId = `${id}-msg`;
  const optId = (i: number) => `${id}-o${i}`;

  useEffect(() => { if (open && active >= 0) document.getElementById(`${id}-o${active}`)?.scrollIntoView({ block: "nearest" }); }, [open, active, id]);

  const close = () => { setOpen(false); setQuery(null); setActive(-1); };
  const pick = (o: string) => { onChange(o); onSelect?.(o); close(); };

  function type(text: string) {
    setQuery(text);
    setOpen(true);
    setActive(-1);
    if (freeText) onChange(text);
    else { const hit = exactOption(options, text); if (hit) onChange(hit); } // typed in full or browser autofill
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || (open && active >= 0 && (e.key === "Home" || e.key === "End"))) {
      e.preventDefault();
      if (!open) setOpen(true);
      setActive((i) => moveActive(e.key, i, list.length));
    } else if (e.key === "Enter" && open) {
      if (active >= 0 && list[active]) { e.preventDefault(); pick(list[active]); } else close();
    } else if (e.key === "Escape" && open) {
      e.preventDefault(); // keep an enclosing <dialog> open
      e.stopPropagation();
      close();
    }
  }

  function blur() {
    if (!freeText && query !== null) { const hit = exactOption(options, query); if (hit && hit !== value) onChange(hit); }
    close();
    onBlur?.();
  }

  // free text: no matches simply means the typed value is used, so nothing to say
  const empty = loading ? uiCopy.loadingOptions : !freeText && list.length === 0 ? uiCopy.noMatches : null;
  return (
    <div className={clsx("relative flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-meta font-medium text-ink">{label}</label>
      <div className="relative">
        <input
          ref={ref} id={id} name={name} type="text" role="combobox" value={shown} placeholder={placeholder} disabled={disabled}
          autoComplete={autoComplete ?? "off"} aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-list`}
          aria-activedescendant={open && active >= 0 ? optId(active) : undefined}
          aria-invalid={!!error} aria-describedby={hint || error ? msgId : undefined}
          onChange={(e) => type(e.target.value)} onKeyDown={onKey} onBlur={blur} onClick={() => setOpen(true)}
          className={clsx(
            "h-11 w-full rounded-sm border bg-surface pl-3 pr-10 text-body text-ink placeholder:text-ink-muted",
            "focus:border-ink focus:outline-none disabled:bg-surface-warm disabled:text-ink-muted",
            error ? "border-danger" : "border-line",
          )}
        />
        <button type="button" tabIndex={-1} aria-label={uiCopy.showOptions} disabled={disabled}
          onMouseDown={(e) => e.preventDefault()} onClick={() => (open ? close() : setOpen(true))}
          className="absolute inset-y-0 right-0 grid w-10 place-items-center text-ink-soft">
          <ChevronDown className={clsx("size-4 transition-transform duration-(--dur-fast)", open && "rotate-180")} aria-hidden />
        </button>
        <ul
          id={`${id}-list`} role="listbox" aria-label={label} data-lenis-prevent hidden={!open || (!list.length && !empty)}
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto overscroll-contain rounded-md border border-line bg-surface p-1 shadow-md"
        >
          {list.map((o, i) => (
            <li
              key={o} id={optId(i)} role="option" aria-selected={o === value}
              onMouseDown={(e) => e.preventDefault()} onClick={() => pick(o)} onMouseMove={() => active !== i && setActive(i)}
              className={clsx("flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-sm px-3 text-body", i === active && "bg-surface-warm", o === value && "font-medium")}
            >
              {o}
              {o === value && <Check className="size-4 shrink-0" aria-hidden />}
            </li>
          ))}
          {empty && <li role="presentation" className="flex min-h-11 items-center px-3 text-meta text-ink-soft">{empty}</li>}
        </ul>
      </div>
      {(error || hint) && (
        <p id={msgId} className={clsx("text-meta", error ? "text-danger" : "text-ink-soft")}>{error ? `⚠ ${error}` : hint}</p>
      )}
    </div>
  );
}
