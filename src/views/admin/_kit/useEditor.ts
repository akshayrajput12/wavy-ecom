"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { ZodType } from "zod";
import { adminApi, mutate, type HttpMethod } from "../api";

export type Errors = Record<string, string>;

/** validation_error details `{field: [msg]}` -> `{field: msg}`. */
export function fieldErrors(details: unknown): Errors {
  if (!details || typeof details !== "object") return {};
  return Object.fromEntries(Object.entries(details as Record<string, unknown>).map(([k, v]) => [k, Array.isArray(v) ? String(v[0]) : String(v)]));
}

/** Form draft + explicit save (client zod check first, then the API) + two-step delete. Navigates to `back` on success. */
export function useEditor<T extends object>(initial: T, opts: { schema: ZodType; back: string }) {
  const router = useRouter();
  const [v, setV] = useState<T>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof T>(k: K, val: T[K]) => setV((d) => ({ ...d, [k]: val }));
  const done = () => { router.push(opts.back); router.refresh(); };

  async function save(method: Exclude<HttpMethod, "GET" | "DELETE">, path: string, body: unknown, success = "Saved") {
    const parsed = opts.schema.safeParse(body);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0] ?? "form"), i.message])));
      return;
    }
    setErrors({});
    setBusy(true);
    const res = await mutate(method, path, body, { success });
    setBusy(false);
    if (res.ok) done();
    else setErrors(fieldErrors(res.details));
  }

  async function remove(path: string, success = "Deleted") {
    setBusy(true);
    const res = await adminApi("DELETE", path);
    setBusy(false);
    if (res.ok) { toast.success(success); done(); } else toast.error("Couldn't delete", { description: res.error });
  }
  return { v, set, errors, busy, save, remove };
}
