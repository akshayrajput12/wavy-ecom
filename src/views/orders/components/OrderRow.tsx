import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import type { AccountOrder } from "@/data/orders";
import { formatDate, formatPrice } from "@/lib/format";

export function OrderRow({ order }: { order: AccountOrder }) {
  const count = order.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <Link href={`/account/orders/${order.number}`}
      className="flex items-center gap-4 rounded-md border border-line bg-surface p-4 transition-colors hover:border-ink">
      <div className="flex -space-x-3">
        {order.items.slice(0, 3).map((i) => (
          <div key={i.id} className="relative size-14 overflow-hidden rounded-sm border-2 border-surface bg-surface-warm">
            <Image src={i.image.url} alt={i.image.alt} fill sizes="56px" className="object-cover" />
          </div>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">#{order.number}</p>
          <StatusBadge status={order.status} />
        </div>
        <p className="t-meta">{formatDate(order.placedAt)} · {count} {count === 1 ? "item" : "items"}</p>
      </div>
      <p className="font-medium">{formatPrice(order.totals.total)}</p>
      <ChevronRight className="size-4 text-ink-muted" aria-hidden />
    </Link>
  );
}
