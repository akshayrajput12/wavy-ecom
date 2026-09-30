"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/Panel";
import { useCan } from "@/components/admin/useRole";
import type { Product, ProductVariant } from "@/types/domain";
import { mutate } from "../api";
import { AdjustDialog } from "./components/AdjustDialog";

export type StockRow = ProductVariant & { productName: string };

export function InventoryView({ products, reasons, threshold, initialFilter }: { products: Product[]; reasons: string[]; threshold: number; initialFilter?: string }) {
  const [rows, setRows] = useState<StockRow[]>(() => products.flatMap((p) => p.variants.map((v) => ({ ...v, productName: p.name }))));
  const [adjusting, setAdjusting] = useState<StockRow | null>(null);
  const canWrite = useCan("inventory.write");
  const level = (r: StockRow) => (r.stock === 0 ? "out" : r.stock <= threshold ? "low" : "ok");

  const apply = (row: StockRow, delta: number, reason: string, note: string) => {
    const before = rows;
    setRows(rows.map((r) => (r.id === row.id ? { ...r, stock: r.stock + delta, status: r.stock + delta === 0 ? "out_of_stock" : "active" } : r)));
    // TODO(backend agent): call /api/admin/inventory/adjust (idempotency key, writes audit log + stock ledger)
    void mutate("inventory/adjust", { variantId: row.id, delta, reason, note, idempotencyKey: crypto.randomUUID() },
      { success: `${row.sku}: ${delta > 0 ? "+" : ""}${delta} (${reason})`, rollback: () => setRows(before) });
    setAdjusting(null);
  };

  const columns: Column<StockRow>[] = [
    { key: "sku", header: "SKU", sort: (r) => r.sku, cell: (r) => <span className="font-medium">{r.sku}</span> },
    { key: "product", header: "Product", sort: (r) => r.productName, cell: (r) => r.productName },
    { key: "variant", header: "Variant", cell: (r) => `${r.color} · ${r.size}` },
    { key: "stock", header: "On hand", align: "right", sort: (r) => r.stock, cell: (r) => r.stock },
    { key: "level", header: "Level", sort: (r) => r.stock, cell: (r) => {
      const l = level(r);
      return <Badge dot tone={l === "out" ? "danger" : l === "low" ? "warning" : "success"}>{l === "out" ? "Out of stock" : l === "low" ? "Low" : "In stock"}</Badge>;
    } },
    { key: "act", header: "Actions", cell: (r) => <Button size="sm" variant="secondary" disabled={!canWrite} onClick={() => setAdjusting(r)}>Adjust</Button> },
  ];

  return (
    <>
      <PageHeader title="Inventory" description={`Variant-level stock. Low stock threshold: ${threshold} units.`} />
      <DataTable
        caption="Variant stock" rows={rows} columns={columns} getId={(r) => r.id} pageSize={15}
        search={(r) => `${r.sku} ${r.productName}`} searchPlaceholder="Search SKU or product"
        initialFilters={initialFilter === "low" ? { level: "low" } : undefined}
        filters={[{ key: "level", label: "Stock", options: [{ value: "low", label: "Low + out" }, { value: "out", label: "Out of stock" }, { value: "ok", label: "Healthy" }],
          match: (r, v) => (v === "low" ? level(r) !== "ok" : level(r) === v) }]}
      />
      <AdjustDialog row={adjusting} reasons={reasons} onClose={() => setAdjusting(null)} onApply={apply} />
    </>
  );
}
