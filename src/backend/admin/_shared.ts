import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { createClient, type PostgrestError, type SupabaseClient } from "@supabase/supabase-js";
import type { ZodType } from "zod";
import { hasSupabase } from "@/lib/env";
import { logger } from "@/lib/logger";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { ApiError } from "@/backend/_core/http";
import { getSession, requirePermission, requireUser } from "@/backend/_core/auth";
import { can, type Permission } from "@/backend/_core/permissions";
import type { Database, Json } from "@/types/database";
import type { CamelRow, StaffSession } from "@/types/admin";

export type Db = SupabaseClient<Database>;
export type Actor = StaffSession;

/** Admin reads/writes need the service key too (cost prices, RPCs that are service-only). */
export const adminReady = hasSupabase && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
const notConfigured = () => new ApiError(503, "supabase_not_configured", "Supabase not configured");

let service: Db | undefined;
/** Service-role client (bypasses RLS). Only call after guard(). */
export function db(): Db {
  if (!adminReady) throw notConfigured();
  service ??= createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return service;
}

/** Session-bound client: RLS + auth.uid() apply, so DB triggers record the staff actor. */
export async function userDb(): Promise<Db> {
  return (await createSessionClient()) as unknown as Db;
}

const staffOf = cache(async (userId: string, fallbackEmail: string | null): Promise<Actor | null> => {
  const p = maybe(await db().from("profiles").select("role, status, email, full_name").eq("id", userId).maybeSingle());
  if (!p || p.status !== "active" || p.role === "customer") return null;
  return { userId, email: p.email ?? fallbackEmail, name: p.full_name, role: p.role };
});

/** Signed-in, active staff member (DB-verified), or null. For the admin shell. */
export async function staffSession(): Promise<Actor | null> {
  if (!adminReady) return null;
  const s = await getSession();
  return s ? staffOf(s.userId, s.email ?? null) : null;
}

/**
 * JWT gate (requirePermission) + a DB re-check of the profile, so a suspended or demoted staff
 * member with a still-valid token is refused before any service-role query runs.
 */
export async function guard(perm: Permission | Permission[]): Promise<Actor> {
  if (!adminReady) throw notConfigured();
  const perms = Array.isArray(perm) ? perm : [perm];
  const s = perms.length === 1 ? await requirePermission(perms[0]) : await requireUser();
  const me = await staffOf(s.userId, s.email ?? null);
  if (!me || !perms.some((x) => can(me.role, x))) throw new ApiError(403, "forbidden", `Missing permission: ${perms.join(" or ")}`);
  return me;
}

export function assertCan(actor: Actor, perm: Permission) {
  if (!can(actor.role, perm)) throw new ApiError(403, "forbidden", `Missing permission: ${perm}`);
}

/** Getter wrapper: empty value without Supabase, else guard + query. */
export async function read<T>(perm: Permission | Permission[], empty: T, fn: (actor: Actor) => Promise<T>): Promise<T> {
  if (!adminReady) return empty;
  return fn(await guard(perm));
}

const PG_STATUS: Record<string, [number, string]> = {
  "23505": [409, "conflict"], "23503": [409, "in_use"], "23514": [422, "constraint_violation"],
  "22023": [422, "invalid_input"], "22P02": [422, "invalid_input"], P0001: [422, "rejected"],
  P0002: [404, "not_found"], "42501": [403, "forbidden"], PGRST116: [404, "not_found"],
};

type Res<T> = { data: T; error: PostgrestError | null };

/** Throw the mapped error. Raised RPC/trigger messages are stable codes (SCHEMA.md) and pass through. */
export function exec(res: { error: PostgrestError | null }): void {
  if (!res.error) return;
  const [status, code] = PG_STATUS[res.error.code] ?? [500, "db_error"];
  if (status === 500) logger.error("admin.db_error", res.error, { code: res.error.code });
  throw new ApiError(status, code, status === 500 ? "Database error" : res.error.message, res.error.details || undefined);
}
/** Result that must have data (lists, .single(), RPCs). */
export function must<T>(res: Res<T>): NonNullable<T> {
  exec(res);
  if (res.data == null) throw new ApiError(404, "not_found", "Not found");
  return res.data;
}
/** .maybeSingle() result. */
export function maybe<T>(res: Res<T>): T {
  exec(res);
  return res.data;
}

export function notFound(what: string): never {
  throw new ApiError(404, "not_found", `${what} not found`);
}

/** Supabase caps a response at 1000 rows; page through for admin aggregates. */
export async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<Res<T[] | null>>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const rows = must(await page(from, from + 999));
    out.push(...rows);
    if (rows.length < 1000) return out;
  }
}

/** Parse ?query params with a zod schema (use z.coerce for numbers). */
export const query = <T>(req: Request, schema: ZodType<T>): T => schema.parse(Object.fromEntries(new URL(req.url).searchParams));

export const pageRange = (page = 1, pageSize = 25) => [(page - 1) * pageSize, page * pageSize - 1] as const;

/** Strip PostgREST filter syntax out of free-text search. */
export const searchTerm = (q?: string) => q?.replace(/[,()*%\\"]/g, " ").trim() || undefined;

// ---------- case mapping (shallow: jsonb values keep their own keys) ----------
const toCamel = (k: string) => k.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
const toSnake = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

export function camel<T extends object>(row: T): CamelRow<T> {
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [toCamel(k), v])) as CamelRow<T>;
}
/** camelCase input → snake_case columns; undefined keys are dropped (PATCH semantics). */
export function snake<T = Record<string, unknown>>(input: object): T {
  return Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined).map(([k, v]) => [toSnake(k), v])) as T;
}

// ---------- audit + cache ----------
export async function audit(actor: Actor, action: string, entityType: string, entityId: string | null, before?: unknown, after?: unknown) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip");
  const b = (before ?? null) as Record<string, unknown> | null;
  const a = (after ?? null) as Record<string, unknown> | null;
  const changed = b && a ? Object.keys(a).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k])) : null;
  const { error } = await db().from("audit_logs").insert({
    actor_id: actor.userId, actor_role: actor.role, actor_email: actor.email, action, entity_type: entityType,
    entity_id: entityId, before: b as Json, after: a as Json, changed_fields: changed,
    ip: ip && /^[0-9a-fA-F:.]+$/.test(ip) ? ip : null, user_agent: h.get("user-agent"), request_id: h.get("x-request-id"),
  });
  // ponytail: the change already committed; a lost audit row is logged, not rolled back.
  if (error) logger.error("audit.write_failed", error, { action, entityType, entityId });
}

export type CacheTag = "catalog" | "home" | "content" | "settings";
export const revalidate = (...tags: CacheTag[]) => tags.forEach((t) => revalidateTag(t, { expire: 0 }));
