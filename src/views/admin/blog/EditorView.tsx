"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select, Textarea } from "@/components/admin/Fields";
import { PageHeader, Panel } from "@/components/admin/Panel";
import { SeoFields } from "@/components/admin/SeoFields";
import { BlogPostSchema } from "@/backend/admin/schemas/content";
import type { AdminBlogCategory, AdminBlogPost } from "@/types/admin";
import { slugify } from "@/lib/format";
import { BackLink, DeleteButton, EditorForm } from "../_kit/Chrome";
import { useEditor } from "../_kit/useEditor";
import { CoverField } from "./components/CoverField";
import { MarkdownPreview } from "./components/MarkdownPreview";

const local = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

export function BlogEditorView({ post, categories }: { post: AdminBlogPost | null; categories: AdminBlogCategory[] }) {
  const [touched, setTouched] = useState(!!post);
  const [preview, setPreview] = useState(false);
  const { v, set, errors, busy, save, remove } = useEditor({
    title: post?.title ?? "", slug: post?.slug ?? "", excerpt: post?.excerpt ?? "", coverUrl: post?.coverUrl ?? "", coverAlt: post?.coverAlt ?? "",
    body: post?.body ?? "", status: post?.status ?? "draft", scheduledFor: local(post?.scheduledFor ?? null), authorName: post?.authorName ?? "",
    categoryId: post?.categoryId ?? "", tags: (post?.tags ?? []).join(", "), seoTitle: post?.seoTitle ?? "", seoDescription: post?.seoDescription ?? "",
    canonicalUrl: post?.canonicalUrl ?? "", noindex: post?.noindex ?? false,
  }, { schema: BlogPostSchema, back: "/admin/blog" });

  const submit = () => save(post ? "PATCH" : "POST", post ? `blog/${post.id}` : "blog", {
    title: v.title, slug: v.slug, excerpt: v.excerpt, coverUrl: v.coverUrl || null, coverAlt: v.coverAlt, body: v.body,
    status: v.status, scheduledFor: v.status === "scheduled" && v.scheduledFor ? new Date(v.scheduledFor).toISOString() : null,
    ...(v.authorName ? { authorName: v.authorName } : {}), categoryId: v.categoryId || null,
    tags: v.tags.split(",").map((t) => t.trim()).filter(Boolean),
    seoTitle: v.seoTitle || null, seoDescription: v.seoDescription || null, canonicalUrl: v.canonicalUrl || null, noindex: v.noindex,
  }, post ? "Post saved" : "Post created");

  return (
    <>
      <BackLink href="/admin/blog">All posts</BackLink>
      <PageHeader title={post ? "Edit post" : "New post"} />
      <EditorForm onSave={submit} busy={busy} back="/admin/blog"
        danger={post && <DeleteButton busy={busy} onConfirm={() => void remove(`blog/${post.id}`, "Post deleted")} />}>
        <Panel title="Content">
          <div className="grid gap-4">
            <Input label="Title" value={v.title} error={errors.title}
              onChange={(e) => { set("title", e.target.value); if (!touched) set("slug", slugify(e.target.value)); }} />
            <Input label="Slug" value={v.slug} error={errors.slug} hint="URL: /journal/<slug>" onChange={(e) => { setTouched(true); set("slug", e.target.value); }} />
            <Textarea label="Excerpt" value={v.excerpt} error={errors.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-meta font-medium">Body (markdown)</span>
                <button type="button" aria-pressed={preview} className="min-h-11 px-2 text-meta underline" onClick={() => setPreview((p) => !p)}>{preview ? "Edit" : "Preview"}</button>
              </div>
              {preview
                ? <div className="min-h-64 rounded-sm border border-line p-4"><MarkdownPreview text={v.body} /></div>
                : <Textarea label="Body" className="min-h-64 font-mono" value={v.body} error={errors.body} onChange={(e) => set("body", e.target.value)} wrapperClassName="[&>label]:sr-only" />}
            </div>
          </div>
        </Panel>
        <Panel title="Cover image">
          <CoverField url={v.coverUrl} alt={v.coverAlt} onUrl={(x) => set("coverUrl", x)} onAlt={(x) => set("coverAlt", x)} error={errors.coverUrl} />
        </Panel>
        <Panel title="Publishing">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Status" value={v.status} onChange={(e) => set("status", e.target.value as typeof v.status)}>
              <option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="published">Published</option><option value="archived">Archived</option>
            </Select>
            {v.status === "scheduled" && <Input label="Publish at" type="datetime-local" value={v.scheduledFor} error={errors.scheduledFor} onChange={(e) => set("scheduledFor", e.target.value)} />}
            <Input label="Author" value={v.authorName} error={errors.authorName} onChange={(e) => set("authorName", e.target.value)} />
            <Select label="Category" value={v.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="">None</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Input label="Tags" hint="Comma separated" className="sm:col-span-2" value={v.tags} error={errors.tags} onChange={(e) => set("tags", e.target.value)} />
          </div>
        </Panel>
        <Panel title="SEO">
          <div className="grid gap-4">
            <SeoFields title={v.seoTitle} description={v.seoDescription} path={`/journal/${v.slug}`}
              titleProps={{ value: v.seoTitle, onChange: (e) => set("seoTitle", e.target.value) }}
              descriptionProps={{ value: v.seoDescription, onChange: (e) => set("seoDescription", e.target.value) }} />
            <Input label="Canonical URL" value={v.canonicalUrl} error={errors.canonicalUrl} onChange={(e) => set("canonicalUrl", e.target.value)} />
            <label className="flex min-h-11 items-center gap-2 text-body"><input type="checkbox" className="size-4 accent-ink" checked={v.noindex} onChange={(e) => set("noindex", e.target.checked)} />Hide from search engines (noindex)</label>
          </div>
        </Panel>
      </EditorForm>
    </>
  );
}
