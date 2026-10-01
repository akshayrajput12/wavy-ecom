import { clsx } from "clsx";
import type { ReactNode } from "react";

// Monochrome system: neutral = stone, dark = ink pill, outline = hairline chip (sits on image wells).
const tones = {
  neutral: "bg-accent text-ink",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
  accent: "bg-accent text-ink",
  dark: "bg-ink text-canvas",
  outline: "border border-line bg-surface/85 text-ink-soft backdrop-blur-sm",
} as const;
export type Tone = keyof typeof tones;

/** Status badge: always carries text (and a dot), never colour alone. */
export function Badge({ tone = "neutral", children, dot, className }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-micro font-medium leading-5", tones[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

/** Maps any SRS status value to a tone + human label. */
const STATUS_TONE: Record<string, Tone> = {
  published: "success", active: "success", paid: "success", captured: "success", delivered: "success",
  approved: "success", connected: "success", completed: "success", live: "success", refunded: "info",
  draft: "neutral", archived: "neutral", closed: "neutral", hidden: "neutral", disabled: "neutral",
  pending: "warning", pending_payment: "warning", processing: "info", packed: "info", shipped: "info",
  in_transit: "info", out_for_delivery: "info", scheduled: "info", queued: "info", initiated: "warning",
  needs_attention: "warning", paused: "warning", requested: "warning", out_of_stock: "warning",
  failed: "danger", cancelled: "danger", rejected: "danger", exception: "danger", disconnected: "danger", expired: "neutral",
};
export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "neutral"} dot>{status.replace(/_/g, " ")}</Badge>;
}
