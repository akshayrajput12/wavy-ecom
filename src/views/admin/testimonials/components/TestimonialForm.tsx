"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Select, Textarea, Toggle } from "@/components/admin/Fields";
import { FormSection } from "@/components/admin/Panel";
import { Input } from "@/components/ui/Input";
import { TestimonialPatchSchema, TestimonialSchema } from "@/backend/admin/schemas/content";
import type { AdminTestimonial } from "@/types/admin";
import { mutate } from "../../api";
import { ConfirmDelete } from "../../orders/components/ConfirmDelete";
import { detailErrors, fieldErrors } from "../../orders/components/fmt";
import { FormActions } from "../../orders/components/FormActions";

export function TestimonialForm({ testimonial, products }: { testimonial?: AdminTestimonial; products: { id: string; name: string }[] }) {
  const router = useRouter();
  const [f, setF] = useState({
    authorName: testimonial?.authorName ?? "", authorRole: testimonial?.authorRole ?? "", quote: testimonial?.quote ?? "", avatarUrl: testimonial?.avatarUrl ?? "",
    rating: String(testimonial?.rating ?? ""), productId: testimonial?.productId ?? "", isPublished: testimonial?.isPublished ?? false, sortOrder: String(testimonial?.sortOrder ?? 0),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const text = (k: keyof typeof f) => ({ value: String(f[k]), onChange: (e: { target: { value: string } }) => set(k, e.target.value as never), error: errors[k] });
  const done = () => { router.push("/admin/testimonials"); router.refresh(); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      authorName: f.authorName.trim(), authorRole: f.authorRole.trim() || null, quote: f.quote.trim(), avatarUrl: f.avatarUrl.trim() || null,
      rating: f.rating ? Number(f.rating) : null, productId: f.productId || null, isPublished: f.isPublished, sortOrder: Number(f.sortOrder) || 0,
    };
    const parsed = (testimonial ? TestimonialPatchSchema : TestimonialSchema).safeParse(body);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setSaving(true);
    const res = await mutate(testimonial ? "PATCH" : "POST", testimonial ? `testimonials/${testimonial.id}` : "testimonials", parsed.data, { success: testimonial ? "Testimonial saved" : "Testimonial created" });
    setSaving(false);
    if (res.ok) done(); else setErrors(detailErrors(res.details));
  };
  const remove = async () => {
    setSaving(true);
    const res = await mutate("DELETE", `testimonials/${testimonial?.id}`, undefined, { success: "Testimonial deleted" });
    setSaving(false);
    if (res.ok) done();
  };

  return (
    <form onSubmit={save} noValidate>
      <FormSection title="Testimonial">
        <Input label="Author" {...text("authorName")} maxLength={80} /><Input label="Role or location" {...text("authorRole")} maxLength={80} />
        <Textarea label="Quote" value={f.quote} onChange={(e) => set("quote", e.target.value)} error={errors.quote} wrapperClassName="sm:col-span-2" maxLength={600} />
        <Input label="Avatar URL" {...text("avatarUrl")} />
        <Select label="Rating" value={f.rating} onChange={(e) => set("rating", e.target.value)} error={errors.rating}>
          <option value="">No rating</option>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
        </Select>
        <Select label="Product (optional)" value={f.productId} onChange={(e) => set("productId", e.target.value)}>
          <option value="">None</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Input label="Sort order" type="number" {...text("sortOrder")} />
        <div className="sm:col-span-2"><Toggle label="Published" description="Shown on the storefront when on." checked={f.isPublished} onChange={(v) => set("isPublished", v)} /></div>
      </FormSection>
      <FormActions saving={saving} backHref="/admin/testimonials" extra={testimonial && <ConfirmDelete busy={saving} onConfirm={() => void remove()} />} />
    </form>
  );
}
