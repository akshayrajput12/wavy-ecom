"use client";

import { Input } from "@/components/ui/Input";
import { PageHeader, Panel } from "@/components/admin/Panel";
import { SeoFields } from "@/components/admin/SeoFields";
import { SeoOverrideSchema } from "@/backend/admin/schemas/content";
import type { AdminSeoOverride } from "@/types/admin";
import { BackLink, DeleteButton, EditorForm } from "../_kit/Chrome";
import { useEditor } from "../_kit/useEditor";

export function OverrideEditorView({ item }: { item: AdminSeoOverride | null }) {
  const { v, set, errors, busy, save, remove } = useEditor({
    path: item?.path ?? "/", title: item?.title ?? "", description: item?.description ?? "", ogTitle: item?.ogTitle ?? "",
    ogDescription: item?.ogDescription ?? "", ogImageUrl: item?.ogImageUrl ?? "", canonicalUrl: item?.canonicalUrl ?? "",
    noindex: item?.noindex ?? false, nofollow: item?.nofollow ?? false,
  }, { schema: SeoOverrideSchema, back: "/admin/seo" });
  const n = (s: string) => s.trim() || null;
  const submit = () => save(item ? "PATCH" : "POST", item ? `seo-overrides/${item.id}` : "seo-overrides", {
    path: v.path, title: n(v.title), description: n(v.description), ogTitle: n(v.ogTitle), ogDescription: n(v.ogDescription),
    ogImageUrl: n(v.ogImageUrl), canonicalUrl: n(v.canonicalUrl), noindex: v.noindex, nofollow: v.nofollow,
  }, "Override saved");
  return (
    <>
      <BackLink href="/admin/seo">SEO</BackLink>
      <PageHeader title={item ? "Edit override" : "New override"} />
      <EditorForm onSave={submit} busy={busy} back="/admin/seo" danger={item && <DeleteButton busy={busy} onConfirm={() => void remove(`seo-overrides/${item.id}`, "Override deleted")} />}>
        <Panel>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Path" className="sm:col-span-2" hint="Starts with /, e.g. /collections/summer" value={v.path} error={errors.path} onChange={(e) => set("path", e.target.value)} />
            <SeoFields title={v.title} description={v.description} path={v.path}
              titleProps={{ value: v.title, onChange: (e) => set("title", e.target.value) }}
              descriptionProps={{ value: v.description, onChange: (e) => set("description", e.target.value) }} />
            <Input label="Social title" value={v.ogTitle} error={errors.ogTitle} onChange={(e) => set("ogTitle", e.target.value)} />
            <Input label="Social description" value={v.ogDescription} error={errors.ogDescription} onChange={(e) => set("ogDescription", e.target.value)} />
            <Input label="Social image URL" value={v.ogImageUrl} error={errors.ogImageUrl} onChange={(e) => set("ogImageUrl", e.target.value)} />
            <Input label="Canonical URL" value={v.canonicalUrl} error={errors.canonicalUrl} onChange={(e) => set("canonicalUrl", e.target.value)} />
            <label className="flex min-h-11 items-center gap-2 text-body"><input type="checkbox" className="size-4 accent-ink" checked={v.noindex} onChange={(e) => set("noindex", e.target.checked)} />noindex</label>
            <label className="flex min-h-11 items-center gap-2 text-body"><input type="checkbox" className="size-4 accent-ink" checked={v.nofollow} onChange={(e) => set("nofollow", e.target.checked)} />nofollow</label>
          </div>
        </Panel>
      </EditorForm>
    </>
  );
}
