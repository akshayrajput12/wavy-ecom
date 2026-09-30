import "server-only";
import type { z } from "zod";
import { ApiError } from "@/backend/_core/http";
import type { AdminGateway, AdminPayment, AdminPaymentAttempt, AdminPaymentEvent, Enum, Paginated } from "@/types/admin";
import type { Json } from "@/types/database";
import { type Actor, audit, camel, db, fetchAll, maybe, must, notFound, pageRange, read, revalidate, snake } from "./_shared";
import { orderByNumber } from "./orders";
import type { GatewayPatchSchema, PaymentListQuery } from "./schemas/ops";

type Kind = z.infer<typeof PaymentListQuery>["kind"];
type Item<K extends Kind> = K extends "payments" ? AdminPayment : K extends "attempts" ? AdminPaymentAttempt : AdminPaymentEvent;

async function withOrderNumbers<T extends { order_id: string | null }>(rows: T[]) {
  const ids = [...new Set(rows.map((r) => r.order_id).filter((x): x is string => !!x))];
  const orders = ids.length ? must(await db().from("orders").select("id, order_number").in("id", ids)) : [];
  const num = new Map(orders.map((o) => [o.id, o.order_number]));
  return rows.map((r) => ({ ...camel(r), orderNumber: r.order_id ? num.get(r.order_id) ?? null : null }));
}

/** kind=payments|attempts|events; status matches payments.status / payment_attempts.status / payment_events.processing_status. */
export const listPayments = <K extends Kind>(q: z.infer<typeof PaymentListQuery> & { kind: K }) =>
  read("payments.read", { items: [], total: 0, page: q.page, pageSize: q.pageSize } as Paginated<Item<K>>, async () => {
    const c = db();
    const [from, to] = pageRange(q.page, q.pageSize);
    const orderId = q.orderNumber ? (await orderByNumber(q.orderNumber)).id : undefined;
    const page = { page: q.page, pageSize: q.pageSize };
    if (q.kind === "attempts") {
      let b = c.from("payment_attempts").select("*", { count: "exact" }).order("started_at", { ascending: false });
      if (q.provider) b = b.eq("provider", q.provider);
      if (q.status) b = b.eq("status", q.status as Enum<"payment_attempt_status">);
      if (q.failureStage) b = b.eq("failure_stage", q.failureStage as Enum<"payment_failure_stage">);
      if (orderId) b = b.eq("order_id", orderId);
      if (q.from) b = b.gte("started_at", q.from);
      if (q.to) b = b.lt("started_at", q.to);
      const res = await b.range(from, to);
      return { items: (await withOrderNumbers(must(res))) as Item<K>[], total: res.count ?? 0, ...page };
    }
    if (q.kind === "events") {
      let b = c.from("payment_events").select("*", { count: "exact" }).order("received_at", { ascending: false });
      if (q.provider) b = b.eq("provider", q.provider);
      if (q.status) b = b.eq("processing_status", q.status);
      if (orderId) b = b.eq("order_id", orderId);
      if (q.from) b = b.gte("received_at", q.from);
      if (q.to) b = b.lt("received_at", q.to);
      const res = await b.range(from, to);
      return { items: (await withOrderNumbers(must(res))) as Item<K>[], total: res.count ?? 0, ...page };
    }
    let b = c.from("payments").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (q.provider) b = b.eq("provider", q.provider);
    if (q.status) b = b.eq("status", q.status as Enum<"payment_status">);
    if (q.failureStage) b = b.eq("last_failure_stage", q.failureStage as Enum<"payment_failure_stage">);
    if (orderId) b = b.eq("order_id", orderId);
    if (q.from) b = b.gte("created_at", q.from);
    if (q.to) b = b.lt("created_at", q.to);
    const res = await b.range(from, to);
    return { items: (await withOrderNumbers(must(res))) as Item<K>[], total: res.count ?? 0, ...page };
  });

/** Repairs a half-finished capture and lists captures that still need refunds (never moves money). */
export async function reconcilePayment(actor: Actor, orderNumber: string) {
  const o = await orderByNumber(orderNumber);
  const result = must(await db().rpc("reconcile_order_payment", { p_order_id: o.id }));
  await audit(actor, "payment.reconcile", "orders", o.id, { status: o.status, paymentStatus: o.payment_status }, { result });
  return result;
}

export const listGateways = () => read("payments.read", [] as AdminGateway[], async () => {
  const c = db();
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const [gateways, attempts] = await Promise.all([
    c.from("payment_gateways").select("*").order("sort_order").then(must),
    fetchAll((f, t) => c.from("payment_attempts").select("provider, status, failure_stage").gte("started_at", since).order("id").range(f, t)),
  ]);
  return gateways.map((g) => {
    const mine = attempts.filter((a) => a.provider === g.provider);
    const captured = mine.filter((a) => a.status === "captured").length;
    const failed = mine.filter((a) => a.status === "failed" || a.status === "cancelled");
    const failuresByStage: Record<string, number> = {};
    for (const a of failed) failuresByStage[a.failure_stage ?? "unknown"] = (failuresByStage[a.failure_stage ?? "unknown"] ?? 0) + 1;
    return { ...camel(g), stats24h: { attempts: mine.length, captured, failed: failed.length, successRate: mine.length ? captured / mine.length : 0, failuresByStage } };
  });
});

const SECRET_KEY = /secret|salt|password|token|api[_-]?key/i;

export async function updateGateway(actor: Actor, provider: Enum<"payment_provider">, input: z.infer<typeof GatewayPatchSchema>) {
  const c = db();
  if (input.config && Object.keys(input.config).some((k) => SECRET_KEY.test(k))) {
    throw new ApiError(422, "secret_in_config", "Secrets belong in environment variables, not gateway config");
  }
  const before = maybe(await c.from("payment_gateways").select("*").eq("provider", provider).maybeSingle());
  if (!before) notFound("Gateway");
  const { config, ...rest } = input;
  const row = must(await c.from("payment_gateways").update({
    ...snake(rest), ...(config ? { config: { ...(before.config as Record<string, Json>), ...config } as Json } : {}), updated_by: actor.userId,
  }).eq("provider", provider).select("*").single());
  await audit(actor, "gateway.update", "payment_gateways", row.id, before, row);
  revalidate("settings");
  return camel(row);
}
