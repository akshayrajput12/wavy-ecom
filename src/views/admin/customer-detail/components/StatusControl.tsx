"use client";

import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { AdminCustomerRow } from "@/types/admin";
import { useAct } from "../../orders/components/act";
import { ConfirmDelete } from "../../orders/components/ConfirmDelete";

/** Block (two-step) or unblock a customer account. */
export function StatusControl({ customer }: { customer: AdminCustomerRow }) {
  const { busy, run } = useAct();
  if (customer.role !== "customer" || customer.status === "deleted") return <StatusBadge status={customer.status} />;
  const set = (status: "active" | "blocked") => void run("PATCH", `customers/${customer.id}`, { status }, status === "blocked" ? "Customer blocked" : "Customer unblocked");
  return (
    <span className="flex flex-wrap items-center gap-2">
      <StatusBadge status={customer.status} />
      {customer.status === "blocked"
        ? <Button size="sm" variant="secondary" loading={busy} onClick={() => set("active")}>Unblock</Button>
        : <ConfirmDelete label="Block" prompt="Block this customer from signing in?" yes="Yes, block" busy={busy} onConfirm={() => set("blocked")} />}
    </span>
  );
}
