import { ArrowUpRight, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { orderStatusLabels } from "@/data/copy";
import { formatDate, formatPrice } from "@/lib/format";
import type { OrderSummary } from "@/types/domain";
import { ac } from "@/views/account/copy";

/** Order card: thumb, mono number, text status badge, total and a circular arrow that fills on hover. */
export function OrderRow({ order }: { order: OrderSummary }) {
  return (
    <Link href={`/account/orders/${order.number}`} className="group flex min-h-24 items-center gap-4 rounded-lg border border-line bg-surface p-3 pr-4 transition-colors hover:border-ink sm:gap-5">
      <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-md bg-surface-2 text-ink-muted sm:size-18">
        {order.image?.url
          ? <Image src={order.image.url} alt={order.image.alt || ""} fill sizes="72px" className="object-cover transition-[scale] duration-(--dur-slow) ease-soft group-hover:scale-105" />
          : <Package className="size-5" aria-hidden />}
      </span>
      <span className="grid min-w-0 flex-1 gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="t-index text-ink">#{order.number}</span>
          <Badge tone={order.status === "cancelled" ? "danger" : order.status === "delivered" ? "success" : "neutral"} dot>{orderStatusLabels[order.status]}</Badge>
        </span>
        <span className="t-meta">{formatDate(order.placedAt)} · {ac.items(order.itemCount)}</span>
      </span>
      <span className="font-medium tabular-nums">{formatPrice(order.total)}</span>
      <span aria-hidden className="hidden size-10 shrink-0 place-items-center rounded-pill border border-line transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-canvas sm:grid">
        <ArrowUpRight className="size-4 transition-transform duration-(--dur-base) group-hover:rotate-45" />
      </span>
    </Link>
  );
}
