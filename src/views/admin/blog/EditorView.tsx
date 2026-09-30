"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, Textarea } from "@/components/admin/Fields";
import { FormSection, PageHeader, Panel } from "@/components/admin/Panel";
import { SeoFields } from "@/components/admin/SeoFields";
import type { AdminBlogPost } from "@/data/admin/types";
import { slugify } from "@/lib/format";
import { mutate } from "../api";

const schema = z.object({
  title: z.string().trim().min(4, "Title is required"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and dashes"),
  excerpt: z.string().trim().min(10, "Write a one-line excerpt"),
  body: z.string(),
  author: z.string().min(2),
  tags: z.string(),
  status: z.enum(["draft", "scheduled", "published"]),
  publishAt: z.string(),
  seoTitle: z.string().max(70), seoDescription: z.string().max(170),
}).refine((v) => v.status !== "scheduled" || v.publishAt, { path: ["publishAt"], message: "Pick a date to schedule" })
  .refine((v) => v.status === "draft" || v.body.trim().length >= 50, { path: ["body"], message: "At least 50 characters before publishing" });
type Form = z.infer<typeof schema>;

// datetime-local values are treated as IST ("YYYY-MM-DDTHH:mm"), independent of server/browser timezone.
const IST = 330 * 60000;
const toLocal = (iso?: string) => (iso ? new Date(new Date(iso).getTime() + IST).toISOString().slice(0, 16) : "");
const fromLocal = (v: string) => new Date(`${v}:00+05:30`).toISOString();

export function BlogEditorView({ post }: { post: AdminBlogPost | null }) {
  const router = useRouter();
  const { register, control, handleSubmit, setValue, getValues, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: post?.title ?? "", slug: post?.slug ?? "", excerpt: post?.excerpt ?? "", body: post?.body ?? "", author: post?.author ?? "Editorial",
      tags: post?.tags.join(", ") ?? "", status: post?.status ?? "draft", publishAt: toLocal(post?.publishAt),
      seoTitle: post?.seo.title ?? "", seoDescription: post?.seo.description ?? "",
    },
  });
  const [slug, status, seoTitle, seoDescription] = useWatch({ control, name: ["slug", "status", "seoTitle", "seoDescription"] });

  const onSubmit = async (v: Form) => {
    const payload = { ...v, id: post?.id, tags: v.tags.split(",").map((t) => t.trim()).filter(Boolean),
      publishAt: v.status === "published" && !v.publishAt ? new Date().toISOString() : v.publishAt && fromLocal(v.publishAt) };
    // TODO(backend agent): call /api/admin/blog (scheduled posts published by cron; revalidates /journal)
    if (await mutate(post ? `blog/${post.id}` : "blog", payload, { success: v.status === "published" ? "Post published" : v.status === "scheduled" ? "Post scheduled" : "Draft saved" })) router.push("/admin/blog");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <PageHeader title={post ? "Edit post" : "New post"} actions={<>
        <Button type="button" size="sm" variant="ghost" onClick={() => router.push("/admin/blog")}>Cancel</Button>
        <Button type="submit" size="sm" loading={isSubmitting}>{status === "published" ? "Publish" : status === "scheduled" ? "Schedule" : "Save draft"}</Button>
      </>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <Panel>
          <FormSection title="Content">
            <Input label="Title" className="sm:col-span-2" error={errors.title?.message} {...register("title", { onBlur: (e) => !getValues("slug") && setValue("slug", slugify(e.target.value)) })} />
            <Input label="Slug" hint={`/journal/${slug || "…"}`} error={errors.slug?.message} {...register("slug")} />
            <Input label="Tags (comma separated)" {...register("tags")} />
            <Textarea label="Excerpt" wrapperClassName="sm:col-span-2" error={errors.excerpt?.message} {...register("excerpt")} />
            <Textarea label="Body (Markdown)" wrapperClassName="sm:col-span-2" className="min-h-72 font-mono text-meta" error={errors.body?.message} {...register("body")} />
          </FormSection>
          <FormSection title="Search appearance">
            <SeoFields title={seoTitle} description={seoDescription} path={`/journal/${slug}`} titleProps={register("seoTitle")} descriptionProps={register("seoDescription")} />
          </FormSection>
        </Panel>
        <Panel title="Publishing">
          <div className="grid gap-4">
            <Select label="Status" {...register("status")}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="published">Published</option></Select>
            {status !== "draft" && <Input label={status === "scheduled" ? "Publish at (IST)" : "Published at (IST)"} type="datetime-local" error={errors.publishAt?.message} {...register("publishAt")} />}
            <Input label="Author" error={errors.author?.message} {...register("author")} />
          </div>
        </Panel>
      </div>
    </form>
  );
}
