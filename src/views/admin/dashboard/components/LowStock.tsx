import Link from "next/link";
import { Panel } from "@/components/admin/Panel";
import type { AdminInventoryRow } from "@/types/admin";

export function LowStock({ items }: { items: AdminInventoryRow[] }) {
  return (
    <Panel title="Low stock" actions={<Link href="/admin/inventory?filter=low" className="text-meta underline underline-offset-4">Inventory</Link>}>
      {items.length === 0 ? <p className="t-meta">All variants above threshold.</p> : (
        <ul className="divide-y divide-line-soft">
          {items.map((v) => (
            <li key={v.variantId} className="flex items-center justify-between gap-3 py-2.5">
              <span className="min-w-0">
                <span className="block truncate text-body">{v.productName}</span>
                <span className="t-meta">{v.sku}</span>
              </span>
              <span className={v.available <= 0 ? "text-meta font-medium text-danger" : "text-meta font-medium text-warning"}>
                {v.available <= 0 ? "Out of stock" : `${v.available} left`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
