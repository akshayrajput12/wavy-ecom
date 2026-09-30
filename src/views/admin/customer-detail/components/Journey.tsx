import { CreditCard, Eye, Search, ShoppingBag, ShoppingCart, Sparkles } from "lucide-react";
import { Panel } from "@/components/admin/Panel";
import { formatDateTime } from "@/components/admin/format";
import type { JourneyEvent } from "@/data/admin/types";

const icons = { page_view: Eye, add_to_cart: ShoppingCart, checkout: ShoppingBag, tryon: Sparkles, search: Search, payment: CreditCard } as const;
const labels = { page_view: "Viewed", add_to_cart: "Added to cart", checkout: "Checkout", tryon: "Try-on", search: "Search", payment: "Payment" } as const;

/** Recent pages and events (PostHog/GA4 feed). */
export function Journey({ events }: { events: JourneyEvent[] }) {
  return (
    <Panel title="Journey" description="Recent pages visited and key events">
      {events.length === 0 ? <p className="t-meta">No tracked activity in the last 30 days.</p> : (
        <ol className="flex flex-col gap-3">
          {events.map((e, i) => {
            const Icon = icons[e.type];
            return (
              <li key={i} className="flex gap-3 text-body">
                <Icon className="mt-0.5 size-4 shrink-0 text-ink-soft" aria-hidden />
                <span><span className="font-medium">{labels[e.type]}</span> · {e.label}<span className="t-meta block">{formatDateTime(e.at)}</span></span>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
