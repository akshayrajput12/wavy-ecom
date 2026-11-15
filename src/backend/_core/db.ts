import "server-only";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { hasServiceRole, hasSupabase } from "@/lib/env";
import { logger } from "@/lib/logger";
import { publicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { ApiError } from "./http";

let warned = false;
function warnMissing() {
  if (warned) return;
  warned = true;
  logger.warn("supabase.not_configured", { hint: "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy NEXT_PUBLIC_SUPABASE_ANON_KEY); storefront renders empty states" });
}

/** Anon client for public reads, or null when Supabase is not configured (caller returns empty). */
export function publicDb(): SupabaseClient | null {
  if (!hasSupabase) { warnMissing(); return null; }
  return publicClient();
}

/** Request-bound client (RLS as the signed-in user). Throws 503 when Supabase is absent. */
export async function userDb(): Promise<SupabaseClient> {
  if (!hasSupabase) { warnMissing(); throw new ApiError(503, "backend_unavailable", "The store backend is not configured"); }
  return createClient();
}

/** Service-role client for pricing/checkout/payments/webhooks. Throws 503 when not configured. */
export function serviceDb(): SupabaseClient {
  if (!hasServiceRole) { warnMissing(); throw new ApiError(503, "backend_unavailable", "The store backend is not configured"); }
  return adminClient();
}

/** Result of a PostgREST call, errors become typed ApiErrors (RPC messages are stable codes, see SCHEMA.md). */
/** Rows are typed by the caller (the client is untyped): `const rows: Row[] = must(res, "list x")`. */
export function must<T>(res: { data: unknown; error: PostgrestError | null }, what: string): T {
  if (res.error) throw dbError(res.error, what);
  return res.data as T;
}

const STATUS: Record<string, number> = {
  P0002: 404, "42501": 403, "22023": 422, "23505": 409, "23514": 422, P0001: 409, PGRST116: 404,
};

export function dbError(e: PostgrestError, what: string): ApiError {
  const status = STATUS[e.code] ?? 500;
  if (status === 500) {
    logger.error("db.query_failed", e, { what, code: e.code, details: e.details, hint: e.hint });
    return new ApiError(500, "db_error", `Could not ${what}`);
  }
  let details: unknown = e.details || undefined;
  try { if (typeof details === "string") details = JSON.parse(details); } catch { /* plain text detail */ }
  // RPC/trigger messages are stable codes such as `insufficient_stock` or `slug_taken: ...`
  const code = e.message.split(":")[0].trim().replace(/\s+/g, "_").slice(0, 64);
  return new ApiError(status, code, e.message, details);
}

/** Logs and swallows a failed public read so one broken section never breaks the page. */
export function safe<T>(res: { data: unknown; error: PostgrestError | null }, what: string, empty: NoInfer<T>): T {
  if (res.error) {
    logger.error("db.read_failed", res.error, { what, code: res.error.code });
    return empty;
  }
  return (res.data ?? empty) as T;
}
