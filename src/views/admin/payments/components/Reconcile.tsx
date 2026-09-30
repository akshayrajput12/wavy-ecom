"use client";

import { useState } from "react";
import { Panel } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAct } from "../../orders/components/act";

/** Re-check an order's payment against the gateway and repair state (POST payments/reconcile). */
export function Reconcile() {
  const { busy, run } = useAct();
  const [order, setOrder] = useState("");
  const [result, setResult] = useState<unknown>(null);
  return (
    <Panel title="Reconcile an order" description="Compares the order with its payment records and repairs mismatches." className="mb-6">
      <form className="flex flex-wrap items-end gap-3" onSubmit={async (e) => {
        e.preventDefault();
        const res = await run("POST", "payments/reconcile", { orderNumber: order.trim() }, "Reconciled");
        if (res.ok) setResult(res.data);
      }}>
        <Input label="Order number" value={order} onChange={(e) => setOrder(e.target.value)} className="w-60" />
        <Button type="submit" loading={busy} disabled={!order.trim()}>Reconcile</Button>
      </form>
      {result !== null && <pre className="mt-3 max-h-64 overflow-auto rounded-sm bg-surface-warm p-3 text-meta">{JSON.stringify(result, null, 2)}</pre>}
    </Panel>
  );
}
