"use client";

import { Input } from "@/components/ui/Input";
import { Select, Textarea } from "@/components/admin/Fields";
import { PageHeader, Panel } from "@/components/admin/Panel";
import { SeoFields } from "@/components/admin/SeoFields";
import { ContentPageSchema } from "@/backend/admin/schemas/content";
import type { AdminContentPage } from "@/types/admin";
import { slugify } from "@/lib/format";
import { BackLink, DeleteButton, EditorForm } from "../_kit/Chrome";
import { useEditor } from "../_kit/useEditor";

export const PAGE_TYPES = ["about", "faq", "lookbook", "policy", "landing", "custom"] as const;

export function PageEditorView({ page }: { page: AdminContentPage | null }) {
  const { v, set, errors, busy, save, remove } = useEditor({
    title: page?.title ?? "", slug: page?.slug ?? "", pageType: page?.pageType ?? "custom", status: page?.status ?? "draft",
    blocks: JSON.stringify(page?.blocks ?? [], null, 2), seoTitle: page?.seoTitle ?? "", seoDescription: page?.seoDescription ?? "",
    canonicalUrl: page?.canonicalUrl ?? "", noindex: page?.noindex ?? false, jsonError: "",
  }, { schema: ContentPageSchema, back: "/admin/pages" });

  const submit = () => {
    let blocks: unknown;
    try { blocks = JSON.parse(v.blocks); } catch { set("jsonError", "Blocks must be valid JSON"); return; }
    set("jsonError", "");
    return save(page ? "PATCH" : "POST", page ? `pages/${page.id}` : "pages", {
      title: v.title, slug: v.slug, pageType: v.pageType, status: v.status, blocks,
      seoTitle: v.seoTitle || null, seoDescription: v.seoDescription || null, canonicalUrl: v.canonicalUrl || null, noindex: v.noindex,
    }, page ? "Page saved" : "Page created");
  };

  return (
    <>
      <BackLink href="/admin/pages">All pages</BackLink>
      <PageHeader title={page ? "Edit page" : "New page"} />
      <EditorForm onSave={submit} busy={busy} back="/admin/pages" danger={page && <DeleteButton busy={busy} onConfirm={() => void remove(`pages/${page.id}`, "Page deleted")} />}>
        <Panel title="Page">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Title" value={v.title} error={errors.title} onChange={(e) => { set("title", e.target.value); if (!page && !v.slug) set("slug", slugify(e.target.value)); }} />
            <Input label="Slug" value={v.slug} error={errors.slug} onChange={(e) => set("slug", e.target.value)} />
            <Select label="Type" value={v.pageType} onChange={(e) => set("pageType", e.target.value as typeof v.pageType)}>
              {PAGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Select label="Status" value={v.status} onChange={(e) => set("status", e.target.value as typeof v.status)}>
              <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
            </Select>
            <Textarea label="Content blocks (JSON array)" wrapperClassName="sm:col-span-2" className="min-h-64 font-mono" value={v.blocks}
              error={v.jsonError || errors.blocks} hint="Each block is an object, e.g. a heading or text block the storefront renders." onChange={(e) => set("blocks", e.target.value)} />
          </div>
        </Panel>
        <Panel title="SEO">
          <div className="grid gap-4">
            <SeoFields title={v.seoTitle} description={v.seoDescription} path={`/${v.slug}`}
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
