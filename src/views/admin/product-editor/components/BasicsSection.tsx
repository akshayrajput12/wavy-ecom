"use client";

import { useEffect, useState } from "react";
import { Select, Toggle } from "@/components/admin/Fields";
import { FormSection } from "@/components/admin/Panel";
import { Input } from "@/components/ui/Input";
import { slugify } from "@/lib/format";
import { PRODUCT_STATUS } from "@/types/domain";
import { adminApi } from "../../api";
import type { SetForm, EditorForm } from "./form";

export interface Option { id: string; name: string; depth?: number }
type Check = { slug: string; available: boolean; takenBy: string | null };

export function BasicsSection({ f, set, categories, collections, productId, originalSlug }: {
  f: EditorForm; set: SetForm; categories: Option[]; collections: Option[]; productId?: string; originalSlug?: string;
}) {
  const [touched, setTouched] = useState(Boolean(productId));
  const [check, setCheck] = useState<Check | null>(null);

  useEffect(() => {
    if (!f.slug || f.slug === originalSlug) return;
    const t = setTimeout(async () => {
      const q = new URLSearchParams({ entity: "product", slug: f.slug, ...(productId ? { excludeId: productId } : {}) });
      const res = await adminApi<Check>("GET", `slug-check?${q}`);
      setCheck(res.ok ? res.data : null);
    }, 400);
    return () => clearTimeout(t);
  }, [f.slug, originalSlug, productId]);

  const slugNote = f.slug && f.slug !== originalSlug && check?.slug === f.slug
    ? (check.available ? { hint: "Slug is available" } : { error: "Slug is already taken" }) : { hint: `/products/${f.slug || "…"}` };
  const toggleCollection = (id: string) =>
    set({ collectionIds: f.collectionIds.includes(id) ? f.collectionIds.filter((c) => c !== id) : [...f.collectionIds, id] });

  return (
    <FormSection title="Basics" description="Name, URL and how the product is classified.">
      <Input label="Name" value={f.name} maxLength={140} onChange={(e) => set({ name: e.target.value, ...(touched ? {} : { slug: slugify(e.target.value) }) })} />
      <Input label="URL slug" value={f.slug} onChange={(e) => { setTouched(true); set({ slug: e.target.value }); }} {...slugNote} />
      <Input label="Brand" value={f.brand} maxLength={80} onChange={(e) => set({ brand: e.target.value })} />
      <Select label="Category" value={f.categoryId} onChange={(e) => set({ categoryId: e.target.value })}>
        <option value="">Select a category</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{"- ".repeat(c.depth ?? 0)}{c.name}</option>)}
      </Select>
      <fieldset className="sm:col-span-2">
        <legend className="text-meta font-medium text-ink">Collections</legend>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {collections.map((c) => (
            <label key={c.id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border border-line px-3 text-meta has-[:checked]:border-ink has-[:checked]:bg-surface-warm has-[:focus-visible]:ring-2">
              <input type="checkbox" checked={f.collectionIds.includes(c.id)} onChange={() => toggleCollection(c.id)} className="accent-ink" />
              {c.name}
            </label>
          ))}
          {!collections.length && <p className="t-meta">No collections yet.</p>}
        </div>
      </fieldset>
      <Select label="Status" value={f.status} onChange={(e) => set({ status: e.target.value as EditorForm["status"] })}
        hint="Anything other than draft needs the publish permission.">
        {PRODUCT_STATUS.map((st) => <option key={st} value={st}>{st}</option>)}
      </Select>
      <div className="self-center"><Toggle label="Featured" checked={f.isFeatured} onChange={(v) => set({ isFeatured: v })} /></div>
      <Input label="Badges" value={f.badges} onChange={(e) => set({ badges: e.target.value })} hint="Comma separated, up to 5 (New, Bestseller)" />
      <Input label="Tags" value={f.tags} onChange={(e) => set({ tags: e.target.value })} hint="Comma separated, used for search" />
    </FormSection>
  );
}
