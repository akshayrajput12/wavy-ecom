import type { Alert, Kpi, SeriesPoint, TryOnMetrics } from "./types";

// Deterministic demo series (no Math.random → no hydration mismatch).
export const salesSeries: SeriesPoint[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 7, 27 + i));
  const wave = Math.sin(i / 3) * 0.25 + (i % 7 === 5 ? 0.35 : 0) + i * 0.012;
  const orders = Math.round(42 * (1 + wave));
  return { date: d.toISOString().slice(0, 10), orders, revenue: orders * 342000, sessions: Math.round(orders * 38 * (1 + Math.cos(i / 5) * 0.1)) };
});

export const dashboardKpis: Kpi[] = [
  { id: "revenue", label: "Revenue (30d)", value: salesSeries.reduce((s, p) => s + p.revenue, 0), format: "money", delta: 18.4, hint: "vs previous 30 days" },
  { id: "orders", label: "Orders", value: salesSeries.reduce((s, p) => s + p.orders, 0), format: "number", delta: 6.2, hint: "vs previous 30 days" },
  { id: "aov", label: "Avg. order value", value: 342000, format: "money", delta: 2.1, hint: "incl. GST, excl. shipping" },
  { id: "conversion", label: "Conversion", value: 2.63, format: "percent", delta: -0.3, hint: "orders ÷ sessions" },
];

export const dashboardAlerts: Alert[] = [
  { id: "al1", tone: "danger", title: "Payment verification failures rising", body: "7 callbacks failed signature check in the last hour on Razorpay.", href: "/admin/payments" },
  { id: "al2", tone: "warning", title: "4 SKUs below threshold", body: "Daybreak Hoodie and Studio Runner 01 sizes need replenishment.", href: "/admin/inventory?filter=low" },
  { id: "al3", tone: "info", title: "3 reviews awaiting moderation", body: "Oldest pending review is 2 days old.", href: "/admin/reviews" },
];

export const dashboardShortcuts = [
  { label: "Add product", href: "/admin/products/new" },
  { label: "Create coupon", href: "/admin/coupons" },
  { label: "Moderate reviews", href: "/admin/reviews" },
  { label: "Build an offer", href: "/admin/offers" },
];

export const categoryBreakdown = [
  { name: "T-shirts", revenue: 1_84_200_00 },
  { name: "Hoodies", revenue: 1_41_000_00 },
  { name: "Bottoms", revenue: 98_000_00 },
  { name: "Runners", revenue: 2_16_000_00 },
  { name: "Low-tops", revenue: 1_12_500_00 },
];

export const conversionFunnel = [
  { step: "Sessions", count: 48210 },
  { step: "Product view", count: 21940 },
  { step: "Add to cart", count: 4380 },
  { step: "Checkout started", count: 2110 },
  { step: "Payment attempted", count: 1640 },
  { step: "Order placed", count: 1268 },
];

export const dateRanges = [
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
] as const;

export const tryOnMetrics: TryOnMetrics = {
  kpis: [
    { id: "gen", label: "Generations (30d)", value: 8420, format: "number", delta: 22.5, hint: "sessions that produced a render" },
    { id: "completion", label: "Completion rate", value: 91.4, format: "percent", delta: 1.8, hint: "completed ÷ started" },
    { id: "atc", label: "Try-on → add to cart", value: 18.7, format: "percent", delta: 3.2, hint: "vs 9.1% without try-on" },
    { id: "purchase", label: "Try-on → purchase", value: 6.9, format: "percent", delta: 0.9, hint: "within 7 days of try-on" },
  ],
  daily: Array.from({ length: 14 }, (_, i) => {
    const generations = 240 + Math.round(Math.sin(i / 2) * 40) + i * 6;
    return { date: new Date(Date.UTC(2026, 8, 12 + i)).toISOString().slice(0, 10), generations, completed: Math.round(generations * 0.91) };
  }),
  funnel: [
    { step: "Try-on opened", count: 12040 },
    { step: "Photo uploaded", count: 9210 },
    { step: "Render completed", count: 8420 },
    { step: "Added to cart", count: 1575 },
    { step: "Purchased", count: 581 },
  ],
  providers: [
    { name: "Primary (FASHN)", generations: 7210, costPaise: 57_680_00, avgSeconds: 14.2, failureRate: 3.1 },
    { name: "Fallback (on-device MediaPipe)", generations: 1210, costPaise: 0, avgSeconds: 2.4, failureRate: 7.8 },
  ],
  assetTtlHours: 24,
  purgedLast24h: 312,
};
