"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Select, Textarea, Toggle } from "@/components/admin/Fields";
import { FormSection, PageHeader } from "@/components/admin/Panel";
import { useCan } from "@/components/admin/useRole";
import { adminCopy } from "@/data/copy";
import { Input } from "@/components/ui/Input";
import { ReviewPatchSchema, ReviewSchema } from "@/backend/admin/schemas/marketing";
import type { AdminReview } from "@/types/admin";
import { REVIEW_STATUS } from "@/types/domain";
import { mutate } from "../api";
import { DeleteDialog } from "../orders/components/DeleteDialog";
import { detailErrors, fieldErrors, fromLocalInput, toLocalInput } from "../orders/components/fmt";
import { FormActions } from "../orders/components/FormActions";
import { RatingOverride } from "./components/RatingOverride";

interface Props { products: { id: string; name: string; slug: string }[]; review?: AdminReview }

/** Create (/admin/reviews/new) or edit (/admin/reviews/[id]/edit) a review. The product is fixed once created. */
export function ReviewComposerView({ products, review }: Props) {
  const router = useRouter();
  const canDelete = useCan("reviews.moderate");
  const [f, setF] = useState({
    productId: review?.productId ?? "", authorName: review?.authorName ?? "", authorLocation: review?.authorLocation ?? "", rating: String(review?.rating ?? 5),
    title: review?.title ?? "", body: review?.body ?? "", status: review?.status ?? "approved", verifiedPurchase: review?.verifiedPurchase ?? false,
    createdAt: toLocalInput(review?.createdAt),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const text = (k: keyof typeof f) => ({ value: String(f[k]), onChange: (e: { target: { value: string } }) => set(k, e.target.value as never), error: errors[k] });
  const product = products.find((p) => p.id === f.productId);
  const done = () => { router.push("/admin/reviews"); router.refresh(); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      authorName: f.authorName.trim(), authorLocation: f.authorLocation.trim() || null, rating: Number(f.rating), title: f.title.trim(), body: f.body.trim(),
      status: f.status, verifiedPurchase: f.verifiedPurchase, ...(f.createdAt ? { createdAt: fromLocalInput(f.createdAt) ?? undefined } : {}),
    };
    const parsed = review ? ReviewPatchSchema.safeParse(body) : ReviewSchema.safeParse({ ...body, productId: f.productId });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setSaving(true);
    const res = await mutate(review ? "PATCH" : "POST", review ? `reviews/${review.id}` : "reviews", parsed.data, { success: review ? "Review saved" : "Review created" });
    setSaving(false);
    if (res.ok) done(); else setErrors(detailErrors(res.details));
  };
  const remove = async () => {
    const res = await mutate("DELETE", `reviews/${review?.id}`, undefined, { success: adminCopy.remove.reviewDeleted });
    if (res.ok) done();
    return res.ok;
  };

  return (
    <>
      <PageHeader title={review ? "Edit review" : "Add review"} description="Admin-entered reviews are labelled with source admin. Mark verified only if an order backs it." />
      <form onSubmit={save} noValidate>
        <FormSection title="Review">
          <Select label="Product" value={f.productId} disabled={!!review} onChange={(e) => set("productId", e.target.value)} error={errors.productId}>
            <option value="">Choose a product</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Select label="Rating" value={f.rating} onChange={(e) => set("rating", e.target.value)} error={errors.rating}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}</Select>
          <Input label="Title" {...text("title")} maxLength={120} className="sm:col-span-2" />
          <Textarea label="Review text" value={f.body} onChange={(e) => set("body", e.target.value)} error={errors.body} wrapperClassName="sm:col-span-2" maxLength={5000} />
        </FormSection>
        <FormSection title="Author and status">
          <Input label="Author name" {...text("authorName")} maxLength={60} /><Input label="Location" {...text("authorLocation")} maxLength={60} />
          <Select label="Status" value={f.status} onChange={(e) => set("status", e.target.value as typeof f.status)}>{REVIEW_STATUS.map((s) => <option key={s}>{s}</option>)}</Select>
          <Input label="Review date" type="datetime-local" {...text("createdAt")} hint="Optional: backdate an imported review" />
          <div className="sm:col-span-2"><Toggle label="Verified purchase" description="Shows the verified badge." checked={f.verifiedPurchase} onChange={(v) => set("verifiedPurchase", v)} /></div>
        </FormSection>
        <FormActions saving={saving} backHref="/admin/reviews" extra={review && canDelete && (
          <DeleteDialog title={adminCopy.remove.reviewTitle} body={adminCopy.remove.reviewBody(review.authorName, review.productName ?? "Unknown product")} onConfirm={remove} />
        )} />
      </form>
      {product && <div className="mt-8"><RatingOverride key={product.slug} slug={product.slug} /></div>}
    </>
  );
}
