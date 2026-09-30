import { ChevronRight, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { orderStatusLabels } from "@/data/copy";
import { formatDate, formatPrice } from "@/lib/format";
import type { OrderSummary } from "@/types/domain";
import { ac } from "@/views/account/copy";

export function OrderRow({ order }: { order: OrderSummary }) {
  return (
    <Link href={`/account/orders/${order.number}`} className="flex min-h-20 items-center gap-4 rounded-lg border border-line bg-surface p-4 transition-colors hover:border-ink">
      <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-sm bg-surface-2 text-ink-muted">
        {order.image?.url ? <Image src={order.image.url} alt={order.image.alt || ""} fill sizes="56px" className="object-cover" /> : <Package className="size-5" aria-hidden />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium">#{order.number}</span>
          <Badge tone={order.status === "cancelled" ? "danger" : order.status === "delivered" ? "success" : "info"} dot>{orderStatusLabels[order.status]}</Badge>
        </span>
        <span className="block t-meta">{formatDate(order.placedAt)} · {ac.items(order.itemCount)}</span>
      </span>
      <span className="font-medium tabular-nums">{formatPrice(order.total)}</span>
      <ChevronRight className="size-4 text-ink-muted" aria-hidden />
    </Link>
  );
}
