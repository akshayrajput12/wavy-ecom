import type { z } from "zod";

const dt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
export const fmtDateTime = (d: string | null | undefined) => (d ? dt.format(new Date(d)) : "-");

/** Rupee text input <-> integer paise. */
export const toPaise = (rupees: string) => Math.round(Number(rupees) * 100);
export const toRupees = (paise: number | null | undefined) => (paise == null ? "" : String(paise / 100));

/** ISO <-> <input type="datetime-local"> value (browser local time). */
export const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

/** First message per field from a zod error or an API validation_error `details` map. */
export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) out[String(i.path[0] ?? "form")] ??= i.message;
  return out;
}
export function detailErrors(details: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (details && typeof details === "object") for (const [k, v] of Object.entries(details)) if (Array.isArray(v) && v.length) out[k] = String(v[0]);
  return out;
}
