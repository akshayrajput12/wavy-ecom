import "server-only";

/**
 * Structured logger. One JSON line per event in production (grep/ship-friendly),
 * compact coloured lines in dev. Secrets are redacted by key name.
 *
 *   const log = logger.child({ svc: "payments", orderId });
 *   log.info("payment.initiated", { provider: "razorpay", amount });
 *   log.error("payment.verify_failed", err, { step: "signature" });
 */
type Level = "debug" | "info" | "warn" | "error";
type Ctx = Record<string, unknown>;

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const DEFAULT: Level = process.env.NODE_ENV === "production" ? "info" : "debug";
const MIN = LEVELS[(process.env.LOG_LEVEL as Level) || DEFAULT] ?? LEVELS.info;
const PRETTY = process.env.NODE_ENV !== "production";
const SECRET = /pass(word)?|secret|token|authorization|api[_-]?key|card|cvv|signature/i;
const COLOR: Record<Level, string> = { debug: "\x1b[90m", info: "\x1b[36m", warn: "\x1b[33m", error: "\x1b[31m" };

function redact(v: unknown, depth = 0): unknown {
  if (depth > 5 || v === null || typeof v !== "object") return v;
  if (Array.isArray(v)) return v.map((x) => redact(x, depth + 1));
  return Object.fromEntries(
    Object.entries(v).map(([k, x]) => [k, SECRET.test(k) ? "[redacted]" : redact(x, depth + 1)]),
  );
}

function serializeError(e: unknown) {
  if (e instanceof Error) return { name: e.name, message: e.message, stack: e.stack?.split("\n").slice(0, 6).join("\n") };
  return { message: String(e) };
}

function write(level: Level, base: Ctx, msg: string, ctx?: Ctx, err?: unknown) {
  if (LEVELS[level] < MIN) return;
  const rec: Ctx = { t: new Date().toISOString(), level, msg, ...base, ...(redact(ctx) as Ctx) };
  if (err) rec.err = serializeError(err);
  const out = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  if (!PRETTY) return out(JSON.stringify(rec));
  const { t, level: _l, msg: _m, ...rest } = rec;
  const tail = Object.keys(rest).length ? " " + JSON.stringify(rest) : "";
  out(`${COLOR[level]}${level.toUpperCase().padEnd(5)}\x1b[0m ${String(t).slice(11, 23)} ${msg}${tail}`);
}

export interface Logger {
  debug(msg: string, ctx?: Ctx): void;
  info(msg: string, ctx?: Ctx): void;
  warn(msg: string, ctx?: Ctx): void;
  error(msg: string, err?: unknown, ctx?: Ctx): void;
  child(ctx: Ctx): Logger;
}

function make(base: Ctx): Logger {
  return {
    debug: (m, c) => write("debug", base, m, c),
    info: (m, c) => write("info", base, m, c),
    warn: (m, c) => write("warn", base, m, c),
    error: (m, e, c) => write("error", base, m, c, e),
    child: (c) => make({ ...base, ...c }),
  };
}

export const logger = make({ app: "wavy" });
