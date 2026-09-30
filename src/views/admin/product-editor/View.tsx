"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, Textarea, Toggle } from "@/components/admin/Fields";
import { FormSection, PageHeader, Panel } from "@/components/admin/Panel";
import { SeoFields } from "@/components/admin/SeoFields";
import { useCan } from "@/components/admin/useRole";
import { slugify } from "@/lib/format";
import { PRODUCT_STATUS, type Category, type Product } from "@/types/domain";
import { mutate } from "../api";
import { productSchema, toForm, type ProductForm } from "./components/schema";
import { VariantsTable } from "./components/VariantsTable";

export function ProductEditorView({ product, categories }: { product: Product | null; categories: Category[] }) {
  const router = useRouter();
  const canWrite = useCan("catalog.write");
  const { register, control, handleSubmit, setValue, getValues, formState: { errors, isSubmitting, isDirty } } =
    useForm<ProductForm>({ resolver: zodResolver(productSchema), defaultValues: toForm(product) });
  const images = useFieldArray({ control, name: "images" });
  const [slug, seoTitle, seoDescription, tryOn] = useWatch({ control, name: ["slug", "seoTitle", "seoDescription", "tryOnEnabled"] });

  const onSubmit = async (v: ProductForm) => {
    const payload = { ...v, id: product?.id, variants: v.variants.map((x) => ({ ...x, price: Math.round(x.price * 100), compareAt: x.compareAt && Math.round(x.compareAt * 100) })) };
    // TODO(backend agent): call /api/admin/products (server recomputes priceFrom, validates SKUs unique)
    const ok = await mutate(product ? `products/${product.id}` : "products", payload, { success: product ? "Product saved" : "Product created" });
    if (ok && !product) router.push("/admin/products");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <PageHeader
        title={product ? product.name : "New product"}
        description={canWrite ? "Changes go live when status is Published." : "Read-only: your role can't edit the catalog."}
        actions={<>
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push("/admin/products")}>Cancel</Button>
          <Button type="submit" size="sm" loading={isSubmitting} disabled={!canWrite || (!!product && !isDirty)}>Save</Button>
        </>}
      />
      <fieldset disabled={!canWrite} className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <Panel>
          <FormSection title="Product info" description="Name, copy and classification.">
            <Input label="Name" error={errors.name?.message} {...register("name", { onBlur: (e) => !getValues("slug") && setValue("slug", slugify(e.target.value)) })} />
            <Input label="URL slug" hint={`/products/${slug || "…"}`} error={errors.slug?.message} {...register("slug")} />
            <Input label="Short descriptor" error={errors.descriptor?.message} {...register("descriptor")} />
            <Select label="Category" error={errors.categoryId?.message} {...register("categoryId")}>
              <option value="">Select…</option>
              {categories.filter((c) => c.parentId).map((c) => <option key={c.id} value={c.id}>{categories.find((p) => p.id === c.parentId)?.name} / {c.name}</option>)}
            </Select>
            <Textarea label="Description" wrapperClassName="sm:col-span-2" error={errors.description?.message} {...register("description")} />
            <Input label="Material" {...register("material")} />
          </FormSection>
          <FormSection title="Media" description="First image is the listing image. Uploads go to Supabase Storage.">
            <ul className="grid gap-3 sm:col-span-2">
              {images.fields.map((f, i) => (
                <li key={f.id} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <Input label={`Image ${i + 1} URL`} error={errors.images?.[i]?.url?.message} {...register(`images.${i}.url`)} />
                  <Input label="Alt text" error={errors.images?.[i]?.alt?.message} {...register(`images.${i}.alt`)} />
                  <button type="button" onClick={() => images.remove(i)} aria-label={`Remove image ${i + 1}`} className="mb-1 rounded-sm p-2.5 hover:bg-surface-warm"><Trash2 className="size-4" /></button>
                </li>
              ))}
            </ul>
            {/* TODO(backend agent): signed upload URL from /api/admin/media */}
            <Button type="button" size="sm" variant="secondary" className="justify-self-start" onClick={() => images.append({ url: "", alt: "" })}>Add image</Button>
          </FormSection>
          <FormSection title="Variants & pricing" description="Prices in rupees incl. GST. Each colour/size is a SKU.">
            <VariantsTable control={control} register={register} errors={errors} disabled={!canWrite} />
          </FormSection>
          <FormSection title="Search appearance" description="How this product shows up on Google.">
            <SeoFields title={seoTitle} description={seoDescription} path={`/products/${slug}`}
              titleProps={register("seoTitle")} descriptionProps={register("seoDescription")} />
          </FormSection>
        </Panel>
        <div className="flex flex-col gap-6">
          <Panel title="Publish">
            <Select label="Status" {...register("status")}>
              {PRODUCT_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <p className="t-meta mt-2">Draft and unpublished products are hidden from the storefront and sitemap.</p>
          </Panel>
          <Panel title="Virtual try-on">
            <Toggle label="Enable try-on" description="Shows the Try it on button on the product page." checked={tryOn}
              onChange={(v) => setValue("tryOnEnabled", v, { shouldDirty: true })} disabled={!canWrite} />
          </Panel>
        </div>
      </fieldset>
    </form>
  );
}
