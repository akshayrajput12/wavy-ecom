"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, Textarea } from "@/components/admin/Fields";
import { FormSection, PageHeader, Panel } from "@/components/admin/Panel";
import type { Product } from "@/types/domain";
import { mutate } from "../api";

const SOURCES = ["In-store feedback", "Email to support", "Social media (with permission)", "Stylist / editorial"];
const schema = z.object({
  productId: z.string().min(1, "Pick a product"),
  author: z.string().trim().min(2, "Author name is required"),
  source: z.string().min(1, "Where did this review come from?"),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(3, "Add a short title"),
  body: z.string().trim().min(20, "At least 20 characters"),
  consent: z.literal(true, { error: "Confirm the author agreed to publication" }),
});
type Form = z.infer<typeof schema>;

/** Editorial review entry. verifiedPurchase is always false here: only the order system can set it. */
export function ReviewComposerView({ products }: { products: Pick<Product, "id" | "name">[] }) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema), defaultValues: { rating: 5, productId: "", author: "", source: "", title: "", body: "" },
  });
  const onSubmit = async (v: Form) => {
    // TODO(backend agent): call /api/admin/reviews — server forces verifiedPurchase=false, status=pending, stores source + actor
    const ok = await mutate("reviews", { ...v, verifiedPurchase: false, origin: "admin_composed" }, { success: "Review saved to moderation queue" });
    if (ok) router.push("/admin/reviews");
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <PageHeader title="Compose review" description="Record genuine feedback received outside the site."
        actions={<Button type="submit" size="sm" loading={isSubmitting}>Save for moderation</Button>} />
      <Panel>
        <p className="mb-6 flex gap-2 rounded-sm bg-info/10 p-3 text-body text-info">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          Composed reviews are labelled “Editorial” and can never show “Verified purchase”. Only reviews tied to a delivered order are verified.
        </p>
        <FormSection title="Review">
          <Select label="Product" error={errors.productId?.message} {...register("productId")}>
            <option value="">Select…</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Select label="Rating" {...register("rating", { valueAsNumber: true })}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 && "s"}</option>)}
          </Select>
          <Input label="Title" className="sm:col-span-2" error={errors.title?.message} {...register("title")} />
          <Textarea label="Review" wrapperClassName="sm:col-span-2" error={errors.body?.message} {...register("body")} />
        </FormSection>
        <FormSection title="Provenance" description="Kept for audit; not shown publicly.">
          <Input label="Author display name" error={errors.author?.message} {...register("author")} />
          <Select label="Source" error={errors.source?.message} {...register("source")}>
            <option value="">Select…</option>{SOURCES.map((s) => <option key={s}>{s}</option>)}
          </Select>
          <div className="sm:col-span-2">
            <p className="text-meta font-medium">Verified purchase</p>
            <p className="t-meta">Not verified (locked). Editorial reviews can’t claim a purchase.</p>
          </div>
          <label className="flex items-start gap-2 text-body sm:col-span-2">
            <input type="checkbox" className="mt-1 size-4 accent-ink" {...register("consent")} />
            <span>The author agreed to have this published with their name.{errors.consent && <span className="block text-meta text-danger">⚠ {errors.consent.message}</span>}</span>
          </label>
        </FormSection>
      </Panel>
    </form>
  );
}
