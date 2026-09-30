import { Panel } from "@/components/admin/Panel";
import { formatPrice } from "@/lib/format";
import type { RedemptionStats } from "@/types/admin";

/** Redemption counters for a coupon or offer. */
export function Stats({ stats, usageCount, limit }: { stats: RedemptionStats; usageCount: number; limit: number | null }) {
  const cells: [string, string][] = [
    ["Applied", String(stats.applied)], ["Reserved (in checkout)", String(stats.reserved)], ["Reversed", String(stats.reversed)],
    ["Discount given", formatPrice(stats.discountGiven)], ["Usage", `${usageCount}${limit ? ` / ${limit}` : ""}`],
  ];
  return (
    <Panel title="Redemptions" className="mb-6">
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {cells.map(([k, v]) => <div key={k}><dt className="t-meta">{k}</dt><dd className="text-body-lg font-semibold tabular-nums">{v}</dd></div>)}
      </dl>
    </Panel>
  );
}
