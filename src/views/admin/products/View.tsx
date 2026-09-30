"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/Panel";
import { useCan } from "@/components/admin/useRole";
import { formatPrice } from "@/lib/format";
import { PRODUCT_STATUS, type Category, type Product, type ProductStatus } from "@/types/domain";
import { mutate } from "../api";

export function ProductsView({ products, categories }: { products: Product[]; categories: Category[] }) {
  const [rows, setRows] = useState(products);
  const canWrite = useCan("catalog.write");
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";
  const stock = (p: Product) => p.variants.reduce((s, v) => s + v.stock, 0);

  const setStatus = (ids: string[], status: ProductStatus) => {
    const before = rows;
    setRows((r) => r.map((p) => (ids.includes(p.id) ? { ...p, status } : p)));
    // TODO(backend agent): call /api/admin/products/bulk-status
    void mutate("products/bulk-status", { ids, status }, { success: `${ids.length} product(s) ${status}`, rollback: () => setRows(before) });
  };

  const columns: Column<Product>[] = [
    { key: "name", header: "Product", sort: (p) => p.name, cell: (p) => (
      <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 hover:underline">
        <Image src={p.images[0].url} alt="" width={40} height={50} className="h-12 w-10 rounded-sm object-cover" />
        <span><span className="block font-medium">{p.name}</span><span className="t-meta">{p.descriptor}</span></span>
      </Link>
    ) },
    { key: "category", header: "Category", sort: (p) => catName(p.categoryId), cell: (p) => catName(p.categoryId) },
    { key: "price", header: "Price", align: "right", sort: (p) => p.priceFrom, cell: (p) => formatPrice(p.priceFrom) },
    { key: "stock", header: "Stock", align: "right", sort: stock, cell: (p) => <>{stock(p)} <span className="t-meta">/ {p.variants.length} variants</span></> },
    { key: "tryon", header: "Try-on", cell: (p) => (p.tryOnEnabled ? "Enabled" : "—") },
    { key: "status", header: "Status", sort: (p) => p.status, cell: (p) => <StatusBadge status={p.status} /> },
  ];
  const roots = categories.filter((c) => !c.parentId);

  return (
    <>
      <PageHeader title="Products" description="Catalog items, variants and publish state."
        actions={canWrite && <ButtonLink href="/admin/products/new" size="sm">New product</ButtonLink>} />
      <DataTable
        caption="Products" rows={rows} columns={columns} getId={(p) => p.id}
        search={(p) => `${p.name} ${p.variants.map((v) => v.sku).join(" ")}`} searchPlaceholder="Search name or SKU"
        filters={[
          { key: "status", label: "Status", options: PRODUCT_STATUS.map((s) => ({ value: s, label: s })), match: (p, v) => p.status === v },
          { key: "cat", label: "Department", options: roots.map((c) => ({ value: c.id, label: c.name })),
            match: (p, v) => p.categoryId === v || categories.find((c) => c.id === p.categoryId)?.parentId === v },
        ]}
        bulkActions={canWrite ? [
          { label: "Publish", onClick: (ids) => setStatus(ids, "published") },
          { label: "Unpublish", onClick: (ids) => setStatus(ids, "unpublished") },
          { label: "Archive", danger: true, onClick: (ids) => setStatus(ids, "archived") },
        ] : undefined}
        empty={{ title: "No products yet", body: "Create your first product to start selling." }}
      />
    </>
  );
}
