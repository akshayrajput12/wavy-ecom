import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import { logger, type Logger } from "@/lib/logger";
import { hit, RATE_LIMITS } from "./rateLimit";

/**
 * Every API route goes through `route()`. It gives each service the same
 * failure isolation: an exception in one service is logged with a request id
 * and returned as a typed error. It never crashes or leaks into other services.
 * It also applies the per-IP limit for "<METHOD> <svc>" from RATE_LIMITS (429 + retry-after),
 * and defaults responses to `cache-control: private, no-store` (public reads opt in with PUBLIC_CACHE).
 *
 *   export const POST = route("cart", async ({ req, log }) => {
 *     const body = await parse(req, AddItemSchema);
 *     return ok(await cart.addItem(body));
 *   });
 */
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

export const ok = <T>(data: T, init?: ResponseInit) => NextResponse.json({ ok: true, data }, init);
export const fail = (status: number, code: string, message: string, details?: unknown) =>
  NextResponse.json({ ok: false, error: { code, message, details } }, { status, headers: { "cache-control": "private, no-store" } });

export async function parse<T>(req: Request, schema: ZodType<T>): Promise<T> {
  const json = await req.json().catch(() => {
    throw new ApiError(400, "bad_json", "Request body must be JSON");
  });
  return schema.parse(json);
}

/** Query string -> object for zod (repeated keys become arrays). */
export function searchParamsObject(sp: URLSearchParams): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const k of new Set(sp.keys())) { const all = sp.getAll(k); out[k] = all.length > 1 ? all : all[0]; }
  return out;
}

const IP = /^(\d{1,3}(\.\d{1,3}){3}|[0-9a-f:]+)$/i;
/** Caller IP (first x-forwarded-for hop, validated so it casts to inet) + user agent, for payment/audit rows. */
export function clientContext(req: Request): { ip?: string; userAgent?: string } {
  const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "").trim();
  return { ip: IP.test(ip) ? ip : undefined, userAgent: req.headers.get("user-agent")?.slice(0, 500) ?? undefined };
}

/** CDN-cacheable public JSON (no cookies/session in the response). Everything else defaults to private, no-store. */
export const PUBLIC_CACHE = { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" };

type Handler<P> = (ctx: { req: NextRequest; params: P; log: Logger; requestId: string }) => Promise<Response>;

export function route<P = Record<string, string>>(svc: string, handler: Handler<P>) {
  return async (req: NextRequest, ctx: { params: Promise<P> }) => {
    const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
    const log = logger.child({ svc, requestId, method: req.method, path: req.nextUrl.pathname });
    const started = performance.now();
    const rule = RATE_LIMITS[`${req.method} ${svc}`];
    if (rule) {
      const { ok: allowed, retryAfter } = hit(`${req.method} ${svc} ${clientContext(req).ip ?? "unknown"}`, rule[0], rule[1]);
      if (!allowed) {
        log.warn("request.rate_limited", { retryAfter });
        const res = fail(429, "rate_limited", "Too many requests. Please wait a moment and try again.");
        res.headers.set("retry-after", String(retryAfter));
        res.headers.set("x-request-id", requestId);
        return res;
      }
    }
    try {
      const res = await handler({ req, params: await ctx.params, log, requestId });
      res.headers.set("x-request-id", requestId);
      if (!res.headers.has("cache-control")) res.headers.set("cache-control", "private, no-store");
      log.info("request.done", { status: res.status, ms: Math.round(performance.now() - started) });
      return res;
    } catch (e) {
      const ms = Math.round(performance.now() - started);
      if (e instanceof ZodError) {
        log.warn("request.invalid", { ms, issues: e.issues });
        return fail(422, "validation_error", "Invalid input", e.flatten().fieldErrors);
      }
      if (e instanceof ApiError) {
        log.warn("request.rejected", { ms, code: e.code, status: e.status });
        return fail(e.status, e.code, e.message, e.details);
      }
      log.error("request.crashed", e, { ms });
      return fail(500, "internal_error", `Something went wrong (ref ${requestId.slice(0, 8)})`);
    }
  };
}
