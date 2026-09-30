import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import { logger, type Logger } from "@/lib/logger";

/**
 * Every API route goes through `route()`. It gives each service the same
 * failure isolation: an exception in one service is logged with a request id
 * and returned as a typed error. It never crashes or leaks into other services.
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
  NextResponse.json({ ok: false, error: { code, message, details } }, { status });

export async function parse<T>(req: Request, schema: ZodType<T>): Promise<T> {
  const json = await req.json().catch(() => {
    throw new ApiError(400, "bad_json", "Request body must be JSON");
  });
  return schema.parse(json);
}

type Handler<P> = (ctx: { req: NextRequest; params: P; log: Logger; requestId: string }) => Promise<Response>;

export function route<P = Record<string, string>>(svc: string, handler: Handler<P>) {
  return async (req: NextRequest, ctx: { params: Promise<P> }) => {
    const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
    const log = logger.child({ svc, requestId, method: req.method, path: req.nextUrl.pathname });
    const started = performance.now();
    try {
      const res = await handler({ req, params: await ctx.params, log, requestId });
      res.headers.set("x-request-id", requestId);
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
