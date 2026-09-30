import type { z } from "zod";

type Raw = Record<string, string | string[] | undefined>;

/** searchParams -> parsed list query. Blank values dropped, date-only from/to widened to IST day bounds, bad input falls back to defaults. */
export function parseListQuery<S extends z.ZodType>(schema: S, sp: Raw): z.output<S> {
  const clean: Record<string, string> = {};
  for (const [k, raw] of Object.entries(sp)) {
    const v = Array.isArray(raw) ? raw[0] : raw;
    if (!v) continue;
    clean[k] = k === "from" ? `${v}T00:00:00+05:30` : k === "to" ? `${v}T23:59:59+05:30` : v;
  }
  const res = schema.safeParse(clean);
  return res.success ? res.data : schema.parse({});
}
