"use client";

import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/Panel";
import { useCan } from "@/components/admin/useRole";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ProductUpsertSchema } from "@/backend/admin/schemas/catalog";
import type { AdminProduct } from "@/types/admin";
import { adminApi, mutate } from "../api";
import { BasicsSection, type Option } from "./components/BasicsSection";
import { DescriptionSection, MediaSection } from "./components/DescriptionSection";
import { RatingsSection, SeoSection, ShippingSection, SpecsSection } from "./components/DetailSections";
import { ratingBody, toForm, toPayload, type EditorForm } from "./components/form";
import { Preview } from "./components/Preview";
import { uploadNewImages } from "./components/upload";
import { VariantsSection } from "./components/VariantsSection";

const sig = (x: EditorForm) => JSON.stringify({ ...x, media: x.media.map((m) => [m.id, m.alt, Boolean(m.file)]) });
const base = "/admin/products";

export function ProductEditorView({ product, categories, collections }: { product: AdminProduct | null; categories: Option[]; collections: Option[] }) {
  const router = useRouter();
  const canWrite = useCan("catalog.write");
  const canRate = useCan("reviews.moderate");
  const [initial] = useState(() => toForm(product));
  const [f, setF] = useState(initial);
  const [issues, setIssues] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const set = useCallback((p: Partial<EditorForm>) => setF((c) => ({ ...c, ...p })), []);
  const dirty = sig(f) !== sig(initial);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = async () => {
    const pending = Object.fromEntries(f.media.filter((m) => m.file).map((m) => [m.id, { url: "pending", path: "", width: 1, height: 1 }]));
    const check = ProductUpsertSchema.safeParse(toPayload(f, product, pending));
    if (!check.success) {
      setIssues(check.error.issues.map((i) => `${i.path.join(" > ") || "Form"}: ${i.message}`));
      toast.error("Fix the highlighted problems first");
      return;
    }
    setIssues([]);
    setSaving(true);
    const { up, error } = await uploadNewImages(f.media, f.slug);
    if (error) { toast.error(error); setSaving(false); return; }
    const res = await mutate<{ product: AdminProduct }>(product ? "PATCH" : "POST", product ? `products/${product.slug}` : "products",
      toPayload(f, product, up), { success: product ? "Product updated" : "Product created" });
    if (res.ok) {
      const slug = res.data.product.slug;
      if (canRate && JSON.stringify(ratingBody(f)) !== JSON.stringify(ratingBody(initial))) {
        await mutate("PATCH", `products/${slug}/rating`, ratingBody(f), { success: "Ratings updated" });
      }
      router.replace(`${base}/${slug}/edit`);
      router.refresh();
    }
    setSaving(false);
  };

  const remove = async () => {
    if (!product) return;
    const res = await adminApi("DELETE", `products/${product.slug}?mode=delete`);
    if (res.ok) { toast.success("Product deleted"); router.push(base); } else toast.error(res.error);
  };

  const real = { avg: product?.ratingAvg ?? 0, count: product?.reviewCount ?? 0 };
  return (
    <>
      <PageHeader
        title={product ? product.name : "New product"}
        description={canWrite ? "Nothing is saved until you click Save." : "Read-only: your role can't edit the catalog."}
        actions={<>
          {dirty && <span role="status" className="text-meta font-medium text-warning">Unsaved changes</span>}
          <ButtonLink href={base} variant="ghost" size="sm">Back to products</ButtonLink>
          <Button type="button" size="sm" loading={saving} disabled={!canWrite || (Boolean(product) && !dirty)} onClick={save}>{product ? "Update" : "Save"}</Button>
        </>}
      />
      <div className="mb-4 flex gap-2 xl:hidden" role="group" aria-label="Editor view">
        {(["edit", "preview"] as const).map((t) => (
          <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)}
            className={clsx("min-h-11 rounded-pill px-4 text-meta font-medium", tab === t ? "bg-ink text-on-dark" : "bg-surface-warm")}>
            {t === "edit" ? "Edit" : "Live preview"}
          </button>
        ))}
      </div>
      {issues.length > 0 && (
        <div role="alert" className="mb-4 rounded-md border border-danger p-4 text-meta">
          <p className="font-semibold text-danger">Fix these before saving</p>
          <ul className="mt-1 list-disc pl-5">{issues.map((m) => <li key={m}>{m}</li>)}</ul>
        </div>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <fieldset disabled={!canWrite || saving} className={clsx("min-w-0 rounded-lg border border-line bg-surface p-4 sm:p-5", tab === "preview" && "max-xl:hidden")}>
          <legend className="sr-only">Product</legend>
          <BasicsSection f={f} set={set} categories={categories} collections={collections} productId={product?.id} originalSlug={product?.slug} />
          <MediaSection f={f} set={set} />
          <DescriptionSection f={f} set={set} />
          <VariantsSection f={f} set={set} />
          <SpecsSection f={f} set={set} />
          <ShippingSection f={f} set={set} />
          <SeoSection f={f} set={set} />
          <RatingsSection f={f} set={set} canRate={canRate} />
          {product && canWrite && (
            <div className="flex flex-wrap items-center gap-3 pt-6">
              {confirming ? (
                <>
                  <Button type="button" size="sm" className="bg-danger hover:bg-danger" onClick={remove}>Confirm delete</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(false)}>Keep product</Button>
                  <p className="t-meta">Permanent. Products with orders cannot be deleted: archive them instead.</p>
                </>
              ) : <Button type="button" size="sm" variant="secondary" onClick={() => setConfirming(true)}>Delete product</Button>}
            </div>
          )}
        </fieldset>
        <aside aria-label="Live preview" className={clsx("xl:sticky xl:top-20 xl:max-h-[calc(100dvh-6rem)] xl:overflow-y-auto", tab === "edit" && "max-xl:hidden")}>
          <Preview f={f} real={real} />
        </aside>
      </div>
    </>
  );
}
