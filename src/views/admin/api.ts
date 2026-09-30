import { toast } from "sonner";

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
export type AdminApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code: string; error: string; details?: unknown };

/**
 * Call /api/admin/<path> (contract: docs/api/ADMIN_API.md). Never throws: failures come back as
 * { ok: false, status, code, error, details } (validation_error details = { field: [messages] }).
 * `body` may be FormData (uploads) or any JSON value.
 */
export async function adminApi<T = unknown>(method: HttpMethod, path: string, body?: unknown): Promise<AdminApiResult<T>> {
  const form = typeof FormData !== "undefined" && body instanceof FormData;
  try {
    const res = await fetch(`/api/admin/${path.replace(/^\/+/, "")}`, {
      method,
      cache: "no-store",
      headers: body === undefined || form ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : form ? (body as FormData) : JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as
      | { ok: true; data: T }
      | { ok: false; error?: { code?: string; message?: string; details?: unknown } }
      | null;
    if (res.ok && json?.ok) return { ok: true, data: json.data };
    const err = json && !json.ok ? json.error : undefined;
    return { ok: false, status: res.status, code: err?.code ?? "http_error", error: err?.message ?? `Request failed (${res.status})`, details: err?.details };
  } catch {
    return { ok: false, status: 0, code: "network_error", error: "Network error: check your connection and retry." };
  }
}

/** First field message of a validation_error, for a toast description. */
function firstFieldError(details: unknown): string | undefined {
  if (!details || typeof details !== "object") return undefined;
  const [field, msgs] = Object.entries(details as Record<string, unknown>)[0] ?? [];
  return field && Array.isArray(msgs) && msgs.length ? `${field}: ${String(msgs[0])}` : undefined;
}

/** Mutation with toasts; on failure runs `rollback` (undo an optimistic update). Check `result.ok`. */
export async function mutate<T = unknown>(
  method: Exclude<HttpMethod, "GET">, path: string, body: unknown, opts: { success: string; rollback?: () => void },
): Promise<AdminApiResult<T>> {
  const res = await adminApi<T>(method, path, body);
  if (res.ok) toast.success(opts.success);
  else {
    opts.rollback?.();
    toast.error("Couldn't save", { description: firstFieldError(res.details) ?? res.error });
  }
  return res;
}
