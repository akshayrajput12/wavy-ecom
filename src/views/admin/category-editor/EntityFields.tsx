"use client";

import { Input } from "@/components/ui/Input";
import { ImageDropzone, type DropzoneImage } from "@/components/ui/ImageDropzone";
import { Textarea, Toggle } from "@/components/admin/Fields";
import { FormSection } from "@/components/admin/Panel";
import { SeoFields } from "@/components/admin/SeoFields";
import { slugify } from "@/lib/format";

/** Fields shared by the category and collection editors. */
export interface BaseForm {
  name: string; slug: string; description: string; image: DropzoneImage[]; banner: DropzoneImage[];
  isActive: boolean; showOnHome: boolean; seoTitle: string; seoDescription: string;
}
type Errs = Record<string, string>;

export function EntityFields({ form, set, errors, isNew, basePath }: {
  form: BaseForm; set: (p: Partial<BaseForm>) => void; errors: Errs; isNew: boolean; basePath: string;
}) {
  const autoSlug = isNew && form.slug === slugify(form.name);
  return (
    <>
      <FormSection title="Details">
        <Input label="Name" value={form.name} error={errors.name} onChange={(e) => set({ name: e.target.value, ...(autoSlug ? { slug: slugify(e.target.value) } : {}) })} />
        <Input label="Slug" value={form.slug} error={errors.slug} hint={`${basePath}/${form.slug || "..."}`} onChange={(e) => set({ slug: e.target.value })} />
        <Textarea wrapperClassName="sm:col-span-2" label="Description" value={form.description} error={errors.description} onChange={(e) => set({ description: e.target.value })} />
        <div className="grid gap-4 sm:col-span-2">
          <Toggle label="Active" description="Inactive items are hidden from the storefront." checked={form.isActive} onChange={(isActive) => set({ isActive })} />
          <Toggle label="Show on home" checked={form.showOnHome} onChange={(showOnHome) => set({ showOnHome })} />
        </div>
      </FormSection>
      <FormSection title="Images" description="Uploaded when you save.">
        <div className="sm:col-span-2"><ImageDropzone label="Image (card)" max={1} maxSizeMb={5} value={form.image} onChange={(image) => set({ image })} error={errors.imageUrl} /></div>
        <div className="sm:col-span-2"><ImageDropzone label="Banner (wide header)" max={1} maxSizeMb={5} value={form.banner} onChange={(banner) => set({ banner })} error={errors.bannerUrl} /></div>
      </FormSection>
      <FormSection title="SEO">
        <SeoFields
          title={form.seoTitle} description={form.seoDescription} path={`${basePath}/${form.slug}`}
          titleProps={{ value: form.seoTitle, onChange: (e) => set({ seoTitle: e.target.value }) }}
          descriptionProps={{ value: form.seoDescription, onChange: (e) => set({ seoDescription: e.target.value }) }}
        />
      </FormSection>
    </>
  );
}

export function ScheduleFields({ startsAt, endsAt, error, onChange }: {
  startsAt: string; endsAt: string; error?: string; onChange: (p: { startsAt?: string; endsAt?: string }) => void;
}) {
  return (
    <>
      <Input type="datetime-local" label="Starts (IST)" value={startsAt} onChange={(e) => onChange({ startsAt: e.target.value })} />
      <Input type="datetime-local" label="Ends (IST)" value={endsAt} error={error} onChange={(e) => onChange({ endsAt: e.target.value })} />
    </>
  );
}
