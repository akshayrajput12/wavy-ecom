/** Client fetch for the `{ ok, data } | { ok, error }` envelope (backend/_core/http.ts). Never throws. */
export type ApiError = { code: string; message: string; details?: unknown };
export type ApiResult<T> = { ok: true; status: number; data: T } | { ok: false; status: number; error: ApiError };

export async function api<T>(url: string, init: { method?: string; body?: unknown; headers?: Record<string, string>; signal?: AbortSignal } = {}): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: init.method ?? (init.body === undefined ? "GET" : "POST"),
      headers: { ...(init.body === undefined ? {} : { "content-type": "application/json" }), ...init.headers },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: init.signal,
    });
    const json = (await res.json().catch(() => null)) as { ok?: boolean; data?: T; error?: ApiError } | null;
    if (res.ok && json?.ok) return { ok: true, status: res.status, data: json.data as T };
    return { ok: false, status: res.status, error: json?.error ?? { code: "http_error", message: "Something went wrong. Please try again." } };
  } catch {
    return { ok: false, status: 0, error: { code: "network_error", message: "We couldn't reach our servers. Check your connection and try again." } };
  }
}
