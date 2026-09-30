import "server-only";
import type { z } from "zod";
import { can } from "@/backend/_core/permissions";
import type { AdminAnalytics, AdminDashboard, Enum, Kpi } from "@/types/admin";
import type { OrderStatus } from "@/types/domain";
import { db, fetchAll, maybe, must, read } from "./_shared";
import { scanInventory } from "./inventory";
import { toOrderRows } from "./orders";
import type { AnalyticsQuery } from "./schemas/settings";

/** Orders that count as sales (placed, not cancelled / unpaid / fully refunded). */
const SOLD = new Set<OrderStatus>(["paid", "processing", "packed", "shipped", "delivered", "return_requested", "returned"]);
const DAY = 86_400_000;
const FUNNEL = ["product_viewed", "add_to_cart", "checkout_started", "payment_initiated", "order_created"] as const;

/**
 * ponytail: aggregates run in Node over paged selects (PostgREST has no GROUP BY without db-aggregates).
 * Fine to ~100k orders per range; past that add SQL views / an RPC and swap these helpers.
 */
async function ordersBetween(from: string, to: string) {
  return fetchAll((f, t) => db().from("orders").select("id, total, status, placed_at, payment_provider")
    .gte("placed_at", from).lt("placed_at", to).order("placed_at").range(f, t));
}
const sum = (rows: { total: number; status: OrderStatus }[]) => rows.filter((o) => SOLD.has(o.status)).reduce((s, o) => s + o.total, 0);
const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;

export const getDashboard = () =>
  read(["catalog.read", "orders.read", "analytics.read", "inventory.read"], { kpis: [], recentOrders: [], lowStock: [] } as AdminDashboard, async (actor) => {
    const c = db();
    const now = Date.now();
    const iso = (ms: number) => new Date(ms).toISOString();
    const kpis: Kpi[] = [];
    let recentOrders: AdminDashboard["recentOrders"] = [];
    if (can(actor.role, "orders.read") || can(actor.role, "analytics.read")) {
      const [cur, prev, today, pending, returns, attempts, failed, recent] = await Promise.all([
        ordersBetween(iso(now - 30 * DAY), iso(now)),
        ordersBetween(iso(now - 60 * DAY), iso(now - 30 * DAY)),
        ordersBetween(new Date(new Date().setHours(0, 0, 0, 0)).toISOString(), iso(now)),
        count(c.from("orders").select("id", { count: "exact", head: true }).in("status", ["paid", "processing", "packed"])),
        count(c.from("return_requests").select("id", { count: "exact", head: true }).in("status", ["requested", "approved", "pickup_scheduled"])),
        count(c.from("payment_attempts").select("id", { count: "exact", head: true }).gte("started_at", iso(now - DAY))),
        count(c.from("payment_attempts").select("id", { count: "exact", head: true }).gte("started_at", iso(now - DAY)).in("status", ["failed", "cancelled"])),
        c.from("orders").select("id, order_number, status, payment_status, payment_provider, customer_name, email, phone, total, placed_at")
          .order("placed_at", { ascending: false }).limit(8).then(must),
      ]);
      const sold = (r: typeof cur) => r.filter((o) => SOLD.has(o.status)).length;
      const aov = (r: typeof cur) => (sold(r) ? Math.round(sum(r) / sold(r)) : 0);
      kpis.push(
        { id: "revenue_30d", label: "Revenue (30 days)", value: sum(cur), previous: sum(prev), format: "money" },
        { id: "orders_30d", label: "Orders (30 days)", value: sold(cur), previous: sold(prev), format: "number" },
        { id: "aov_30d", label: "Average order value", value: aov(cur), previous: aov(prev), format: "money" },
        { id: "revenue_today", label: "Revenue today", value: sum(today), format: "money" },
        { id: "to_fulfil", label: "Orders to fulfil", value: pending, format: "number" },
        { id: "open_returns", label: "Open returns", value: returns, format: "number" },
        { id: "payment_failure_24h", label: "Payment failure rate (24h)", value: attempts ? Math.round((failed / attempts) * 1000) / 10 : 0, format: "percent" },
      );
      recentOrders = await toOrderRows(recent);
    }
    let lowStock: AdminDashboard["lowStock"] = [];
    if (can(actor.role, "inventory.read")) {
      const low = (await scanInventory()).filter((r) => r.low).sort((a, b) => a.available - b.available);
      kpis.push({ id: "low_stock", label: "Low-stock variants", value: low.length, format: "number" });
      lowStock = low.slice(0, 8);
    }
    return { kpis, recentOrders, lowStock };
  });

export const getAnalytics = (q: z.infer<typeof AnalyticsQuery>) => {
  const to = q.to ?? new Date().toISOString();
  const from = q.from ?? new Date(Date.parse(to) - 30 * DAY).toISOString();
  const empty: AdminAnalytics = {
    range: { from, to }, totals: { revenue: 0, orders: 0, aov: 0, refunded: 0, sessions: 0 },
    series: [], byStatus: {}, byProvider: [], topProducts: [], funnel: [],
  };
  return read("analytics.read", empty, async () => {
    const c = db();
    const tz = maybe(await c.from("store_settings").select("timezone").maybeSingle())?.timezone ?? "Asia/Kolkata";
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
    const [orders, payments, failedAttempts, refunds, sessions, funnel] = await Promise.all([
      ordersBetween(from, to),
      fetchAll((f, t) => c.from("payments").select("provider, amount_captured").gte("created_at", from).lt("created_at", to).order("id").range(f, t)),
      fetchAll((f, t) => c.from("payment_attempts").select("provider").in("status", ["failed", "cancelled"]).gte("started_at", from).lt("started_at", to).order("id").range(f, t)),
      fetchAll((f, t) => c.from("refunds").select("amount").eq("status", "processed").gte("processed_at", from).lt("processed_at", to).order("id").range(f, t)),
      count(c.from("visitor_sessions").select("id", { count: "exact", head: true }).gte("first_seen_at", from).lt("first_seen_at", to)),
      Promise.all(FUNNEL.map(async (step) => ({
        step, count: await count(c.from("analytics_events").select("id", { count: "exact", head: true }).eq("event_name", step).gte("created_at", from).lt("created_at", to)),
      }))),
    ]);

    const byDay = new Map<string, { revenue: number; orders: number }>();
    for (let t = Date.parse(from); t < Date.parse(to); t += DAY) byDay.set(day.format(t), { revenue: 0, orders: 0 });
    const byStatus: AdminAnalytics["byStatus"] = {};
    for (const o of orders) {
      byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
      if (!SOLD.has(o.status)) continue;
      const d = byDay.get(day.format(Date.parse(o.placed_at))) ?? { revenue: 0, orders: 0 };
      d.revenue += o.total; d.orders++;
      byDay.set(day.format(Date.parse(o.placed_at)), d);
    }

    const soldIds = orders.filter((o) => SOLD.has(o.status)).map((o) => o.id);
    const items: { product_id: string | null; product_name: string; quantity: number; line_total: number }[] = [];
    for (let i = 0; i < soldIds.length; i += 150) {   // chunked: keeps the IN list inside URL limits
      items.push(...must(await c.from("order_items").select("product_id, product_name, quantity, line_total").in("order_id", soldIds.slice(i, i + 150))));
    }
    const top = new Map<string, { productId: string | null; name: string; quantity: number; revenue: number }>();
    for (const it of items) {
      const k = it.product_id ?? it.product_name;
      const t = top.get(k) ?? { productId: it.product_id, name: it.product_name, quantity: 0, revenue: 0 };
      t.quantity += it.quantity; t.revenue += it.line_total;
      top.set(k, t);
    }

    const providers: Enum<"payment_provider">[] = ["razorpay", "payu", "cod"];
    const revenue = sum(orders);
    return {
      range: { from, to },
      totals: { revenue, orders: soldIds.length, aov: soldIds.length ? Math.round(revenue / soldIds.length) : 0, refunded: refunds.reduce((s, r) => s + r.amount, 0), sessions },
      series: [...byDay].sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v })),
      byStatus,
      byProvider: providers.map((p) => ({
        provider: p,
        captured: payments.filter((x) => x.provider === p).reduce((s, x) => s + x.amount_captured, 0),
        payments: payments.filter((x) => x.provider === p && x.amount_captured > 0).length,
        failedAttempts: failedAttempts.filter((x) => x.provider === p).length,
      })),
      topProducts: [...top.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10),
      funnel,
    };
  });
};
