import Image from "next/image";
import { Panel } from "@/components/admin/Panel";
import { formatPrice } from "@/lib/format";
import type { AdminOrderDetail } from "@/types/admin";

export function Items({ order }: { order: AdminOrderDetail }) {
  const rows: [string, number][] = [
    ["Subtotal", order.subtotal], ["Discount", -order.discountTotal], ["Shipping", order.shippingTotal],
    ["COD fee", order.codFee], ["Tax", order.taxTotal],
  ];
  return (
    <Panel title="Items">
      <ul className="divide-y divide-line-soft">
        {order.items.map((i) => (
          <li key={i.id} className="flex gap-3 py-3 first:pt-0">
            {i.imageUrl ? <Image src={i.imageUrl} alt="" width={48} height={64} sizes="48px" unoptimized className="h-16 w-12 rounded-sm object-cover" /> : <span className="h-16 w-12 rounded-sm bg-surface-warm" aria-hidden />}
            <div className="min-w-0 flex-1">
              <p className="font-medium break-words">{i.productName}</p>
              <p className="t-meta">{i.variantTitle} · SKU {i.sku}</p>
              <p className="t-meta">{formatPrice(i.unitPrice)} x {i.quantity}</p>
            </div>
            <p className="shrink-0 tabular-nums">{formatPrice(i.lineTotal)}</p>
          </li>
        ))}
      </ul>
      <dl className="mt-4 grid gap-1 border-t border-line pt-3 text-body">
        {rows.filter(([, v]) => v !== 0).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3"><dt className="text-ink-soft">{k}</dt><dd className="tabular-nums">{formatPrice(v)}</dd></div>
        ))}
        {order.couponCode && <div className="flex justify-between"><dt className="text-ink-soft">Coupon</dt><dd>{order.couponCode}</dd></div>}
        <div className="flex justify-between text-body-lg font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatPrice(order.total)}</dd></div>
      </dl>
    </Panel>
  );
}
