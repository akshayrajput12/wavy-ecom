"use client";

import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { addressCopy } from "@/data/copy";
import { signalBars } from "./geoMath";
import type { GeoStatus } from "./useGeolocation";

const m = addressCopy.map;
type Problem = "denied" | "unavailable" | "timeout" | "insecure" | "unsupported";
export const isProblem = (s: GeoStatus): s is Problem =>
  s === "denied" || s === "unavailable" || s === "timeout" || s === "insecure" || s === "unsupported";

/**
 * Glass strip over the map: scanning radar while locating, then live "±12 m" + signal bars. Accuracy is the browser's
 * own estimate, shown as is. Visual only: the sr-only live region announces status changes, not every reading.
 */
export function StatusStrip({ status, accuracy }: { status: GeoStatus; accuracy?: number }) {
  const acc = accuracy !== undefined ? addressCopy.accuracy(accuracy) : "";
  const bars = accuracy !== undefined ? signalBars(accuracy) : 0;
  const live = status === "refining";
  const said = status === "locating" ? m.locating : status === "refining" ? m.refining("").trim() : status === "done" && acc ? `${m.accuracy(acc)}, ${m.signal[bars]}` : isProblem(status) ? m.off : "";
  return (
    <div className="pointer-events-none absolute left-3 top-3 max-w-[calc(100%-5rem)]">
      <div className="flex min-h-11 items-center gap-2.5 rounded-pill border border-line bg-surface/85 py-1.5 pl-2 pr-3.5 text-meta text-ink shadow-md backdrop-blur-md" aria-hidden>
        {status === "locating" ? <span className="map-scan" />
          : live ? <span className="map-live" />
          : <span className={clsx("size-2.5 rounded-pill", isProblem(status) ? "bg-danger" : acc ? "bg-success" : "bg-ink-muted")} />}
        <span className="truncate font-medium">
          {status === "locating" ? m.locating : isProblem(status) ? m.off : acc || m.idle}
        </span>
        {live && <span className="text-overline font-semibold uppercase tracking-wide text-ink-soft">{m.live}</span>}
        {bars > 0 && !isProblem(status) && <Signal bars={bars} />}
      </div>
      <p role="status" className="sr-only">{said}</p>
    </div>
  );
}

function Signal({ bars }: { bars: number }) {
  return (
    <span className="flex h-3.5 items-end gap-0.5">
      {[1, 2, 3, 4].map((b) => (
        <span key={b} style={{ height: `${b * 25}%` }}
          className={clsx("w-[3px] rounded-pill transition-colors duration-(--dur-base)", b <= bars ? "bg-ink" : "bg-line")} />
      ))}
    </span>
  );
}

/** Permission denied / unavailable / insecure: what happened, how to fix it, and the manual way out. */
export function ProblemCard({ status, onRetry }: { status: Problem; onRetry: () => void }) {
  return (
    <div className="grid gap-2 rounded-lg border border-line bg-surface-warm p-4 text-meta text-ink">
      <p className="font-medium">{m[status]}</p>
      {status === "denied" && <ul className="list-disc pl-5 text-ink-soft">{m.deniedHelp.map((h) => <li key={h}>{h}</li>)}</ul>}
      <p className="text-ink-soft">{m.manual}</p>
      {(status === "denied" || status === "unavailable" || status === "timeout") && (
        <Button type="button" variant="secondary" size="sm" className="min-h-11 justify-self-start" onClick={onRetry}>{m.relocate}</Button>
      )}
    </div>
  );
}
