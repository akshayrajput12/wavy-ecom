"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/Panel";
import { useCan } from "@/components/admin/useRole";
import { StatusBadge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import type { AdminProduct, AdminProductRow, Paginated } from "@/types/admin";
import type { ProductStatus } from "@/types/domain";
import type { ProductListQuery } from "@/backend/admin/schemas/catalog";
import { adminApi, mutate } from "../api";
import { BulkBar, RemoveButton, useCanRemove } from "../_kit/Remove";
import { Filters, listHref } from "./Filters";

type Opt = { id: string; name: string; depth?: number };

const priceText = (p: AdminProductRow) =>
  p.priceMin == null ? "-" : p.priceMax != null && p.priceMax !== p.priceMin ? `${formatPrice(p.priceMin)} to ${formatPrice(p.priceMax)}` : formatPrice(p.priceMin);
const stockText = (p: AdminProductRow) => (p.outOfStock ? "Out of stock" : p.lowStock ? `Low stock: ${p.available}` : `${p.available} in stock`);

export function ProductsView({ data, query, categories, collections }: { data: Paginated<AdminProductRow>; query: ProductListQuery; categories: Opt[]; collections: Opt[] }) {
  const router = useRouter();
  const canWrite = useCan("catalog.write");
  const canPublish = useCan("catalog.publish");
  const canDelete = useCanRemove("products");
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const allOn = data.items.length > 0 && data.items.every((p) => picked.includes(p.id));

  const bulk = async (status: ProductStatus) => {
    setBusy(true);
    const res = await mutate("POST", "products/bulk-status", { ids: picked, status }, { success: `${picked.length} product(s) set to ${status}` });
    setBusy(false);
    if (res.ok) { setPicked([]); router.refresh(); }
  };
  const duplicate = async (slug: string) => {
    const res = await adminApi<{ product: AdminProduct }>("POST", `products/${slug}/duplicate`);
    if (res.ok) { toast.success("Duplicated as a draft"); router.push(`/admin/products/${res.data.product.slug}/edit`); } else toast.error(res.error);
  };

  return (
    <>
      <PageHeader title="Products" description="Catalog items, variants and publish state."
        actions={canWrite && <ButtonLink href="/admin/products/new" size="sm">New product</ButtonLink>} />
      <Filters query={query} categories={categories} collections={collections} />
      {(canPublish || canDelete) && (
        <BulkBar count={picked.length} onClear={() => setPicked([])}>
          {canPublish && <>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => bulk("published")}>Publish</Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => bulk("unpublished")}>Unpublish</Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => bulk("archived")}>Archive</Button>
          </>}
          <RemoveButton noun="products" ids={picked} onDone={() => setPicked([])} />
        </BulkBar>
      )}
      <div className="relative overflow-x-auto overscroll-x-contain rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[52rem] text-left text-body">
          <caption className="sr-only">Products, {data.total} total</caption>
          <thead className="border-b border-line text-meta text-ink-soft">
            <tr>
              <th scope="col" className="w-12 p-3"><input type="checkbox" aria-label="Select all on this page" className="size-5 accent-ink" checked={allOn}
                onChange={() => setPicked(allOn ? [] : data.items.map((p) => p.id))} /></th>
              {["Product", "Category", "Price", "Stock", "Status"].map((h) => <th key={h} scope="col" className="p-3 font-medium">{h}</th>)}
              <th scope="col" className="p-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((p) => (
              <tr key={p.id} className="border-b border-line-soft last:border-0">
                <td className="p-3"><input type="checkbox" aria-label={`Select ${p.name}`} className="size-5 accent-ink" checked={picked.includes(p.id)}
                  onChange={() => setPicked((s) => (s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id]))} /></td>
                <td className="p-3">
                  <Link href={`/admin/products/${p.slug}/edit`} className="flex items-center gap-3 hover:underline">
                    {p.image ? <Image src={p.image} alt="" width={40} height={48} unoptimized className="h-12 w-10 rounded-sm object-cover" /> : <span className="h-12 w-10 rounded-sm bg-surface-warm" aria-hidden />}
                    <span><span className="block font-medium">{p.name}</span><span className="t-meta">{p.brand ?? "No brand"} - {p.variantCount} variant{p.variantCount === 1 ? "" : "s"}</span></span>
                  </Link>
                </td>
                <td className="p-3">{p.categoryName ?? "-"}</td>
                <td className="p-3 whitespace-nowrap">{priceText(p)}</td>
                <td className="p-3 whitespace-nowrap">{stockText(p)}</td>
                <td className="p-3"><StatusBadge status={p.status} /></td>
                <td className="p-3 text-right whitespace-nowrap">
                  <Link href={`/admin/products/${p.slug}/edit`} className="inline-grid min-h-11 place-items-center px-2 text-meta underline underline-offset-4">Edit</Link>
                  {canWrite && <button type="button" onClick={() => duplicate(p.slug)} className="min-h-11 px-2 text-meta underline underline-offset-4">Duplicate</button>}
                  <span className="inline-block align-middle"><RemoveButton compact noun="products" ids={[p.id]} name={p.name} /></span>
                </td>
              </tr>
            ))}
            {!data.items.length && <tr><td colSpan={7} className="p-8 text-center text-ink-soft">No products match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
      <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-meta">
        <span>Page {data.page} of {pages} ({data.total} products)</span>
        <span className="flex gap-2">
          {data.page > 1 && <ButtonLink href={listHref(query, { page: data.page - 1 })} size="sm" variant="secondary">Previous</ButtonLink>}
          {data.page < pages && <ButtonLink href={listHref(query, { page: data.page + 1 })} size="sm" variant="secondary">Next</ButtonLink>}
        </span>
      </nav>
    </>
  );
}
