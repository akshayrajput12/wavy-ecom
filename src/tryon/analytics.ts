export type TryOnEvent = "try_on_opened" | "try_on_started" | "try_on_completed" | "try_on_failed";

/** Fire-and-forget. Never throws, never blocks the UI; the endpoint may not exist yet. */
export function track(event: TryOnEvent, props: Record<string, string | number | boolean> = {}) {
  try {
    const body = JSON.stringify({ event, props: { ...props, mode: "ondevice" }, at: new Date().toISOString() });
    if (navigator.sendBeacon?.("/api/analytics/events", new Blob([body], { type: "application/json" }))) return;
    void fetch("/api/analytics/events", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
  } catch {
    // analytics must never break try-on
  }
}
