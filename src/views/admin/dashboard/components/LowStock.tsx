import Link from "next/link";
import { Panel } from "@/components/admin/Panel";
import type { ProductVariant } from "@/types/domain";

export function LowStock({ items }: { items: (ProductVariant & { productName: string })[] }) {
  return (
    <Panel title="Low stock" actions={<Link href="/admin/inventory?filter=low" className="text-meta underline underline-offset-4">Inventory</Link>}>
      {items.length === 0 ? <p className="t-meta">All variants above threshold.</p> : (
        <ul className="divide-y divide-line-soft">
          {items.map((v) => (
            <li key={v.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="min-w-0">
                <span className="block truncate text-body">{v.productName}</span>
                <span className="t-meta">{v.sku}</span>
              </span>
              <span className={v.stock === 0 ? "text-meta font-medium text-danger" : "text-meta font-medium text-warning"}>
                {v.stock === 0 ? "Out of stock" : `${v.stock} left`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
