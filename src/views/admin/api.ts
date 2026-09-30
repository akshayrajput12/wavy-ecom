import { toast } from "sonner";

export type AdminApiResult<T> = { ok: true; data?: T; demo?: boolean } | { ok: false; error: string };

/**
 * POST /api/admin/<resource>. Never throws.
 * ponytail: a 404 means the route isn't built yet → treated as a local-only (demo) success.
 * TODO(backend agent): implement /api/admin/* routes; drop the 404 shortcut once they exist.
 */
export async function adminApi<T = unknown>(resource: string, body: unknown): Promise<AdminApiResult<T>> {
  try {
    const res = await fetch(`/api/admin/${resource}`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
    });
    if (res.status === 404) return { ok: true, demo: true };
    const json = (await res.json().catch(() => null)) as { ok?: boolean; data?: T; error?: { message?: string } } | null;
    if (!res.ok || !json?.ok) return { ok: false, error: json?.error?.message ?? `Request failed (${res.status})` };
    return { ok: true, data: json.data };
  } catch {
    return { ok: false, error: "Network error — check your connection and retry." };
  }
}

/** Fire a mutation after an optimistic UI update; toasts the outcome and rolls back on failure. */
export async function mutate(resource: string, body: unknown, opts: { success: string; rollback?: () => void }) {
  const res = await adminApi(resource, body);
  if (res.ok) toast.success(opts.success, res.demo ? { description: "Saved locally — admin API not connected yet." } : undefined);
  else {
    opts.rollback?.();
    toast.error("Couldn't save", { description: res.error });
  }
  return res.ok;
}
