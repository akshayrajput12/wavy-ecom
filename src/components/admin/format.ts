import type { Kpi } from "@/types/admin";
import { formatPrice } from "@/lib/format";

const num = new Intl.NumberFormat("en-IN");
const dt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

export const formatNumber = (n: number) => num.format(n);
export const formatDateTime = (d: string) => dt.format(new Date(d));
export const formatKpi = (k: Pick<Kpi, "value" | "format">) =>
  k.format === "money" ? formatPrice(k.value) : k.format === "percent" ? `${k.value.toFixed(1)}%` : num.format(k.value);
