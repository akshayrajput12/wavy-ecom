"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Select } from "@/components/admin/Fields";
import { Input } from "@/components/ui/Input";
import { PRODUCT_STATUS } from "@/types/domain";
import type { ProductListQuery } from "@/backend/admin/schemas/catalog";

type Opt = { id: string; name: string; depth?: number };
const base = "/admin/products";

export function listHref(q: ProductListQuery, patch: Partial<ProductListQuery>) {
  const next = { ...q, page: 1, ...patch };
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) if (v !== undefined && v !== "" && !(k === "page" && v === 1) && !(k === "pageSize" && v === 25)) sp.set(k, String(v));
  return sp.size ? `${base}?${sp}` : base;
}

export function Filters({ query, categories, collections }: { query: ProductListQuery; categories: Opt[]; collections: Opt[] }) {
  const router = useRouter();
  const [q, setQ] = useState(query.q ?? "");
  useEffect(() => {
    if (q === (query.q ?? "")) return;
    const t = setTimeout(() => router.replace(listHref(query, { q: q || undefined })), 350);
    return () => clearTimeout(t);
  }, [q, query, router]);
  const go = (patch: Partial<ProductListQuery>) => router.replace(listHref(query, patch));
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      <Input label="Search" type="search" value={q} placeholder="Name, brand or SKU" onChange={(e) => setQ(e.target.value)} />
      <Select label="Status" value={query.status ?? ""} onChange={(e) => go({ status: (e.target.value || undefined) as ProductListQuery["status"] })}>
        <option value="">All</option>{PRODUCT_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
      </Select>
      <Select label="Category" value={query.categoryId ?? ""} onChange={(e) => go({ categoryId: e.target.value || undefined })}>
        <option value="">All</option>{categories.map((c) => <option key={c.id} value={c.id}>{"- ".repeat(c.depth ?? 0)}{c.name}</option>)}
      </Select>
      <Select label="Collection" value={query.collectionId ?? ""} onChange={(e) => go({ collectionId: e.target.value || undefined })}>
        <option value="">All</option>{collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>
      <Select label="Stock" value={query.stock ?? ""} onChange={(e) => go({ stock: (e.target.value || undefined) as ProductListQuery["stock"] })}>
        <option value="">All</option><option value="in_stock">In stock</option><option value="low">Low stock</option><option value="out">Out of stock</option>
      </Select>
    </div>
  );
}
